const dotenv = require("dotenv");
const Sequelize = require("sequelize");
const dbConfig = require("../config/dbConfig");
const bcrypt = require("bcrypt");
dotenv.config();

const env = process.env.NODE_ENV || "development";
// console.log("⏺️ Using config for:", env);
const config = dbConfig[env];

const sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: config.dialect,
  define: {
    timestamps: false,
    freezeTableName: true,
  },
  logging: false,
});

exports.createSurveyorUser = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      dob,
      mobile,
      email,
      password,
      status,
      user_type_id,
      gender,
      city,
      state,
    } = req.body;

    const requiredFields = [
      "first_name",
      "last_name",
      "mobile",
      "email",
      "password",
      "status",
      "dob",
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === "";
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing or empty required fields: ${missingFields.join(
          ", "
        )}`,
        success: false,
      });
    }

    const userTypeId = Number(user_type_id);
    const result = await sequelize.transaction(async (t) => {
      // Validate user type
      const userTypeQuery = `
        SELECT user_type_category_id FROM user_type WHERE user_type_id = ?
      `;
      const [userType] = await sequelize.query(userTypeQuery, {
        replacements: [userTypeId],
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      });

      const user_type_category_id = userType?.user_type_category_id;
      if (user_type_category_id !== 8) {
        throw new Error("You are not authorized to add this user role.");
      }

      const is_admin = 0;
      const is_superadmin = 0;

      // Check if user already exists
      const existingUserQuery = `
        SELECT user_id FROM user WHERE email = ? OR mobile = ?
      `;
      const [existingUser] = await sequelize.query(existingUserQuery, {
        replacements: [email, mobile],
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      });

      let user_id;

      if (existingUser) {
        user_id = existingUser.user_id;

        const duplicateQuery = `
          SELECT * FROM user_type_mapping WHERE user_id = ? AND user_type_id = ?
        `;
        const [duplicate] = await sequelize.query(duplicateQuery, {
          replacements: [user_id, userTypeId],
          type: sequelize.QueryTypes.SELECT,
          transaction: t,
        });

        if (duplicate) {
          return res.status(400).json({
            message: "This User already has the assigned role.",
            success: false,
          });
        }
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);

        const createUserQuery = `
  INSERT INTO user (first_name, last_name, username, email, password, mobile,   dob)
  VALUES (?, ?, ?, ?, ?, ?,?)
`;

        const result = await sequelize.query(createUserQuery, {
          replacements: [
            first_name,
            last_name,
            email,
            email,
            hashedPassword,
            mobile,
            dob,
          ],
          type: sequelize.QueryTypes.INSERT,
          transaction: t,
        });

        user_id = result[0]; // Inserted user ID
      }

      // Generate unique ID
      const countQuery = `
        SELECT COUNT(utm.user_id) AS count
        FROM user_type_mapping utm
        LEFT JOIN user_type ut ON utm.user_type_id = ut.user_type_id
        WHERE ut.user_type_category_id = ?
      `;
      const [countData] = await sequelize.query(countQuery, {
        replacements: [user_type_category_id],
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      });

      const uniqueIdCount = countData.count;
      const idString = (uniqueIdCount + 1).toString().padStart(7, "0");
      const unique_id = "SU" + idString;

      // Insert into user_type_mapping
      const insertMappingQuery = `
        INSERT INTO user_type_mapping (user_id, user_type_id, is_active, unique_id, status, is_admin, is_superadmin)
        VALUES (?, ?, 1, ?, ?, ?, ?)
      `;
      const mappingResult = await sequelize.query(insertMappingQuery, {
        replacements: [
          user_id,
          userTypeId,
          unique_id,
          status,
          is_admin,
          is_superadmin,
        ],
        type: sequelize.QueryTypes.INSERT,
        transaction: t,
      });

      const user_type_mapping_id_new = mappingResult[0];

      // Optional profile creation
      if (gender || city || state) {
        const profileQuery = `
          INSERT INTO user_profile (user_id, first_name, last_name, email, mobile, current_city, current_state, gender)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await sequelize.query(profileQuery, {
          replacements: [
            user_id,
            first_name,
            last_name,
            email,
            mobile,
            city || null,
            state || null,
            gender || null,
          ],
          type: sequelize.QueryTypes.INSERT,
          transaction: t,
        });
      }

      // Insert into surveyor table
      const insertSurveyorQuery = `
        INSERT INTO surveyor (created_at, updated_at, user_type_mapping_id, user_id)
        VALUES (NOW(), NOW(), ?, ?)
      `;
      await sequelize.query(insertSurveyorQuery, {
        replacements: [user_type_mapping_id_new, user_id],
        type: sequelize.QueryTypes.INSERT,
        transaction: t,
      });

      return { user_id, user_type_mapping_id: user_type_mapping_id_new };
    });

    return res.status(201).json({
      message: "Surveyor partner added successfully",
      success: true,
      result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Internal Server Error",
      success: false,
    });
  }
};

exports.updateSurveyorUser = async (req, res) => {
  try {
    const {
      user_id,
      user_type_mapping_id,
      first_name,
      last_name,

      mobile,
      email,

      status,

      gender = null,
      city = null,
      state = null,
    } = req.body;

    if (
      !user_id ||
      !user_type_mapping_id ||
      !email ||
      !first_name ||
      !last_name ||
      !mobile ||
      !status
    ) {
      return res.status(400).json({
        message: "Missing required fields for update",
        success: false,
      });
    }

    await sequelize.transaction(async (t) => {
      // Update user table
      const updateUserQuery = `
        UPDATE user
        SET first_name = ?, last_name = ?, email = ?, mobile = ?
        WHERE user_id = ?
      `;
      await sequelize.query(updateUserQuery, {
        replacements: [first_name, last_name, email, mobile, user_id],
        type: sequelize.QueryTypes.UPDATE,
        transaction: t,
      });

      // Update user_type_mapping
      const updateMappingQuery = `
        UPDATE user_type_mapping
        SET status = ?, updated_at = NOW()
        WHERE user_type_mapping_id = ?
      `;
      await sequelize.query(updateMappingQuery, {
        replacements: [status, user_type_mapping_id],
        type: sequelize.QueryTypes.UPDATE,
        transaction: t,
      });

      // Update user_profile if exists
      const checkProfileQuery = `
        SELECT user_id FROM user_profile WHERE user_id = ?
      `;
      const [profile] = await sequelize.query(checkProfileQuery, {
        replacements: [user_id],
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      });

      if (profile) {
        const updateProfileQuery = `
          UPDATE user_profile
          SET first_name = ?, last_name = ?, email = ?, mobile = ?, current_city = ?, current_state = ?, gender = ?
          WHERE user_id = ?
        `;
        await sequelize.query(updateProfileQuery, {
          replacements: [
            first_name,
            last_name,
            email,
            mobile,
            city,
            state,
            gender,
            user_id,
          ],
          type: sequelize.QueryTypes.UPDATE,
          transaction: t,
        });
      }

      // Update surveyor table
      const updateSurveyorQuery = `
        UPDATE surveyor
        SET updated_at = NOW()
        WHERE user_id = ? AND user_type_mapping_id = ?
      `;
      await sequelize.query(updateSurveyorQuery, {
        replacements: [user_id, user_type_mapping_id],
        type: sequelize.QueryTypes.UPDATE,
        transaction: t,
      });
    });

    return res.status(200).json({
      message: "Surveyor user updated successfully",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

exports.fetchSurveyorList = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      const query = `SELECT
                      u.first_name,
                      u.last_name,
                      u.email,
                      u.mobile,
                      u.dob,
                      ut.user_type_name AS user_role,
                      s.*,
                      utm.unique_id,
                      utm.status
                    FROM 
                      surveyor s
                    JOIN 
                      user u ON s.user_id = u.user_id
                    JOIN 
                      user_type_mapping utm ON s.user_type_mapping_id = utm.user_type_mapping_id
                    JOIN 
                      user_type ut ON utm.user_type_id = ut.user_type_id;`;
      const surveyorList = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
        raw: true,
      });
      return surveyorList;
    });

    return res.status(200).json({
      message: "franchise partner fetched successfully",
      success: true,
      surveyorList: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};

exports.getSingleSurveyorUser = async (req, res) => {
  try {
    const { franchise_id } = req.params;

    if (!franchise_id) {
      return res.status(400).json({
        message: "Missing franchise_id",
        success: false,
      });
    }

    const query = `
      SELECT 
        u.first_name,
        u.last_name,
        u.email,
        ut.user_type_name AS user_role,
        fp.joined_date,
        fp.status
      FROM 
        franchise_partner fp
      JOIN 
        user u ON fp.user_id = u.user_id
      JOIN 
        user_type_mapping utm ON fp.user_type_mapping_id = utm.user_type_mapping_id
      JOIN 
        user_type ut ON utm.user_type_id = ut.user_type_id
      WHERE 
        fp.franchise_id = ?
    `;

    const [data] = await sequelize.query(query, {
      replacements: [franchise_id],
      type: sequelize.QueryTypes.SELECT,
    });

    if (!data) {
      return res.status(404).json({
        message: "Franchise partner not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Franchise partner fetched successfully",
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.deleteSurveyorUser = async (req, res) => {
  try {
    const { surveyor_unique_id, surveyor_id } = req.query;
    const result = await sequelize.transaction(async (t) => {
      const SELECTED_SURVEYOR_USER_FROM_SURVEYOR = `SELECT surveyor_id FROM surveyor WHERE surveyor_id=?`;
      const isSurveyorUserExist = await sequelize.query(
        SELECTED_SURVEYOR_USER_FROM_SURVEYOR,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: [surveyor_id],
          transaction: t,
          raw: true,
        }
      );

      const SELECTED_SURVEYOR_USER_FROM_USER_TYPE_MAPPING = `SELECT unique_id, user_id FROM user_type_mapping WHERE unique_id = ?`;
      const isSurveyorUserExistInUserTypeMapping = await sequelize.query(
        SELECTED_SURVEYOR_USER_FROM_USER_TYPE_MAPPING,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: [surveyor_unique_id],
          transaction: t,
          raw: true,
        }
      );

      if (
        isSurveyorUserExist.length === 0 ||
        isSurveyorUserExistInUserTypeMapping.length === 0
      ) {
        throw new Error("Franchise Not Found Delete Failed");
      }

      const userList = isSurveyorUserExistInUserTypeMapping[0];

      await sequelize.query(
        `DELETE FROM user_type_mapping WHERE unique_id = ?`,
        {
          type: sequelize.QueryTypes.DELETE,
          replacements: [surveyor_unique_id],
          transaction: t,
        }
      );

      await sequelize.query(`DELETE FROM user_profile WHERE user_id = ?`, {
        type: sequelize.QueryTypes.DELETE,
        replacements: [userList.user_id],
        transaction: t,
      });

      await sequelize.query(`DELETE FROM user WHERE user_id = ?`, {
        type: sequelize.QueryTypes.DELETE,
        replacements: [userList.user_id],
        transaction: t,
      });

      const deletedFranchise = await sequelize.query(
        `DELETE FROM surveyor WHERE surveyor_id = ?`,
        {
          type: sequelize.QueryTypes.DELETE,
          replacements: [surveyor_id],
          transaction: t,
        }
      );

      return deletedFranchise;
    });

    return res.status(200).json({
      message: "Surveyor deleted successfully",
      success: true,
      franchiseList: result,
    });
  } catch (error) {
    return res.status(404).json({ message: error.message, success: false });
  }
};

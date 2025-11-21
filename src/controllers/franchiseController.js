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

exports.createFranchiseWithUser = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      name,
      dob,
      mobile,
      email,
      password,
      location,
      investment_capacity,
      joined_date,
      total_revenue,
      status,
      territory,
    } = req.body;

    const requiredFields = [
      "first_name",
      "last_name",
      "mobile",
      "name",
      "email",
      "password",
      "location",
      "investment_capacity",
      "joined_date",
      "total_revenue",
      "status",
      "territory",
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

    const franchiseUniqueId = `FR${Date.now()}`;
    const result = await sequelize.transaction(async (t) => {
      // const { user_type_mapping_id } = req.user;
      const {
        email,
        password,
        user_type_id,
        first_name,
        last_name,
        mobile,
        status,
      } = req.body;

      const userTypeId = Number(user_type_id);
      const userTypeQuery = `
      
      SELECT user_type_category_id FROM user_type WHERE user_type_id = ?
    `;
      const [userType] = await sequelize.query(userTypeQuery, {
        replacements: [userTypeId],
        type: sequelize.QueryTypes.SELECT,
      });

      const user_type_category_id = userType.user_type_category_id;
      console.log(user_type_category_id);

      if (user_type_category_id !== 7) {
        throw new Error(
          "You are not authorized to add this user role. Please contact the developers."
        );
      }

      const is_admin = 0;
      const is_superadmin = 0;

      const existingUserQuery = `
      SELECT user_id FROM user WHERE (email=? OR mobile=?)
    `;
      const [existingUser] = await sequelize.query(existingUserQuery, {
        replacements: [email, mobile],
        type: sequelize.QueryTypes.SELECT,
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
        });

        if (duplicate) {
          // throw new Error("This User already has the assigned role.");
          return res.status(400).json({
            message: "This User already has the assigned role.",
            success: false,
          });
        }
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);

        const createUserQuery = `
        INSERT INTO user (first_name, last_name, username, email, password, mobile, dob)
        VALUES (?, ?, ?, ?, ?, ?, ?)
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
        });

        user_id = result[0]; // Inserted ID
      }

      // Count users in category
      const countQuery = `
      SELECT COUNT(utm.user_id) AS count
      FROM user_type_mapping utm
      LEFT JOIN user_type ut ON utm.user_type_id = ut.user_type_id
      WHERE ut.user_type_category_id = ?
    `;
      const [countData] = await sequelize.query(countQuery, {
        replacements: [user_type_category_id],
        type: sequelize.QueryTypes.SELECT,
      });

      const uniqueIdCount = countData.count;
      const getCount = uniqueIdCount + 1;
      const idString = getCount.toString().padStart(7, "0");
      const unique_id = "FR" + idString;

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
      });

      const user_type_mapping_id_new = mappingResult[0];

      // Optional profile creation
      if (req.body.gender || req.body.city || req.body.state) {
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
            req.body.city || null,
            req.body.state || null,
            req.body.gender || null,
          ],
          type: sequelize.QueryTypes.INSERT,
        });
      }

      const query = `INSERT INTO franchise_partner(name, email, mobile,location, investment_capacity, joined_date, total_revenue, status, created_at, updated_at, franchise_unique_id, territory, user_type_mapping_id, user_id)
    VALUES (?,?,?,?,?,?,?,?, NOW(), NOW(), ?, ?,?,?)`;
      await sequelize.query(query, {
        replacements: [
          name,
          email,
          mobile,
          location,
          investment_capacity,
          joined_date,
          total_revenue,
          status,
          franchiseUniqueId,
          territory,
          user_type_mapping_id_new,
          user_id,
        ],
        type: sequelize.QueryTypes.INSERT,
        transaction: t,
        raw: true,
      });
    });

    return res.status(201).json({
      message: "franchise partner added successfully",
      success: true,
      result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};

exports.updateFranchiseWithUser = async (req, res) => {
  try {
    const {
      franchise_id,
      first_name,
      last_name,
      name = null,
      mobile,
      email,
      location = null,
      investment_capacity = null,
      joined_date = null,
      total_revenue = null,
      status,
      territory = null,
      user_type_id,
      gender = null,
      city = null,
      state = null,
    } = req.body;

    if (
      !franchise_id ||
      !user_type_id ||
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

    const franchiseId = Number(franchise_id);
    const userTypeId = Number(user_type_id);

    await sequelize.transaction(async (t) => {
      // Get user_id and user_type_mapping_id from franchise_partner
      const franchiseQuery = `
        SELECT user_id, user_type_mapping_id FROM franchise_partner WHERE franchise_id = ?
      `;
      const [franchise] = await sequelize.query(franchiseQuery, {
        replacements: [franchiseId],
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      });

      if (!franchise) {
        throw new Error("Franchise not found");
      }

      const { user_id, user_type_mapping_id } = franchise;

      // Validate user_type
      const userTypeQuery = `
        SELECT user_type_category_id FROM user_type WHERE user_type_id = ?
      `;
      const [userType] = await sequelize.query(userTypeQuery, {
        replacements: [userTypeId],
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      });

      if (!userType || userType.user_type_category_id !== 7) {
        throw new Error("You are not authorised to edit this user role.");
      }

      // Check for duplicate email
      const duplicateEmailQuery = `
        SELECT user_id FROM user WHERE email = ? AND user_id != ?
      `;
      const [existingUser] = await sequelize.query(duplicateEmailQuery, {
        replacements: [email, user_id],
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      });

      if (existingUser) {
        throw new Error("Email already exists");
      }

      // Update user
      const updateUserQuery = `
        UPDATE user
        SET first_name = ?, last_name = ?, email = ?, username = ?, mobile = ?
        WHERE user_id = ?
      `;
      await sequelize.query(updateUserQuery, {
        replacements: [first_name, last_name, email, email, mobile, user_id],
        transaction: t,
      });

      // Check for duplicate role
      const duplicateRoleQuery = `
        SELECT user_type_mapping_id FROM user_type_mapping
        WHERE user_id = ? AND user_type_id = ? AND user_type_mapping_id != ?
      `;
      const [duplicateRole] = await sequelize.query(duplicateRoleQuery, {
        replacements: [user_id, userTypeId, user_type_mapping_id],
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      });

      if (duplicateRole) {
        throw new Error("This User already has the assigned role.");
      }

      // Update user_type_mapping
      const is_admin = userTypeId === 2 ? 1 : 0;
      const is_superadmin = 0;

      const updateMappingQuery = `
        UPDATE user_type_mapping
        SET user_type_id = ?, status = ?, is_admin = ?, is_superadmin = ?, updated_at = NOW()
        WHERE user_type_mapping_id = ?
      `;
      await sequelize.query(updateMappingQuery, {
        replacements: [
          userTypeId,
          status,
          is_admin,
          is_superadmin,
          user_type_mapping_id,
        ],
        transaction: t,
      });

      // Update user_profile
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
        transaction: t,
      });

      // Update franchise_partner
      const updateFranchiseQuery = `
        UPDATE franchise_partner
        SET name = ?, email = ?, location = ?, investment_capacity = ?, mobile=?,
        joined_date = ?, total_revenue = ?, status = ?, territory = ?, updated_at = NOW()
        WHERE franchise_id = ?
      `;
      await sequelize.query(updateFranchiseQuery, {
        replacements: [
          `${first_name} ${last_name}`,
          email,
          location,
          investment_capacity,
          mobile,
          joined_date,
          total_revenue,
          status,
          territory,
          franchiseId,
        ],
        transaction: t,
      });
    });

    return res.status(200).json({
      message: "Franchise partner updated successfully",
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

exports.fetchFranchiseLists = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      const query = `SELECT
                      u.first_name,
                      u.last_name,
                      u.email,
                      u.mobile,
                      u.dob,
                      utm.unique_id,
                      ut.user_type_name AS user_role,
                      fp.*
                    FROM 
                      franchise_partner fp
                    JOIN 
                      user u ON fp.user_id = u.user_id
                    JOIN 
                      user_type_mapping utm ON fp.user_type_mapping_id = utm.user_type_mapping_id
                    JOIN 
                      user_type ut ON utm.user_type_id = ut.user_type_id
                    ORDER BY fp.franchise_id DESC;`;
      const franchiseList = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
        raw: true,
      });
      return franchiseList;
    });

    return res.status(200).json({
      message: "franchise partner fetched successfully",
      success: true,
      franchiseList: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};

exports.getFranchisePartnerById = async (req, res) => {
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

exports.deleteFranchiseUser = async (req, res) => {
  try {
    const { franchise_unique_id, franchise_id } = req.query;
    const result = await sequelize.transaction(async (t) => {
      const SELECTED_FRANCHISE_USER_FROM_FRANCHISE = `SELECT franchise_id FROM franchise_partner WHERE franchise_id=?`;
      const isFranchiseUserExist = await sequelize.query(
        SELECTED_FRANCHISE_USER_FROM_FRANCHISE,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: [franchise_id],
          transaction: t,
          raw: true,
        }
      );

      const SELECTED_FRANCHISE_USER_FROM_USER_TYPE_MAPPING = `SELECT unique_id, user_id FROM user_type_mapping WHERE unique_id = ?`;
      const isFranchiseUserExistInUserTypeMapping = await sequelize.query(
        SELECTED_FRANCHISE_USER_FROM_USER_TYPE_MAPPING,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: [franchise_unique_id],
          transaction: t,
          raw: true,
        }
      );

      if (
        isFranchiseUserExist.length === 0 ||
        isFranchiseUserExistInUserTypeMapping.length === 0
      ) {
        throw new Error("Franchise Not Found Delete Failed");
      }

      const userList = isFranchiseUserExistInUserTypeMapping[0];

      await sequelize.query(
        `DELETE FROM user_type_mapping WHERE unique_id = ?`,
        {
          type: sequelize.QueryTypes.DELETE,
          replacements: [franchise_unique_id],
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
        `DELETE FROM franchise_partner WHERE franchise_id = ?`,
        {
          type: sequelize.QueryTypes.DELETE,
          replacements: [franchise_id],
          transaction: t,
        }
      );

      return deletedFranchise;
    });

    return res.status(200).json({
      message: "Franchise partner deleted successfully",
      success: true,
      franchiseList: result,
    });
  } catch (error) {
    return res.status(404).json({ message: error.message, success: false });
  }
};

// src/controllers/partnerBuilderController.js
const db = require("../models");
const partnerBuilderService = require("../services/partnerBuilderService");
const utils = require("../utils/utils");
const bcrypt = require("bcrypt");
const { getFileUrl } = require("../utils/utils");
const { createTasks } = require("../services/taskService");
const { sendEmail } = require("../services/emailService");
const { Op } = require("sequelize");

const dotenv = require("dotenv");
const Sequelize = require("sequelize");
const dbConfig = require("../config/dbConfig");
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

exports.getCompany = async (req, res) => {
  try {
    const user_type_mapping_id = req.user.user_type_mapping_id;
    const partnerBuilder = await db.PartnerBuilder.findOne({
      where: { user_type_mapping_id },
    });

    const company = await db.Company.findOne({
      where: { company_id: partnerBuilder.company_id },
    });

    res.status(200).json({ company });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.editCompany = async (req, res) => {
  try {
    // Extract the required data from the request body
    const {
      company_id,
      company_name,
      address,
      town,
      mandal,
      city,
      state,
      country,
      pincode,
    } = req.body;

    const updatedCompany = await db.Company.update(
      {
        company_name,
        address,
        town,
        mandal,
        city,
        state,
        country,
        pincode,
      },
      {
        where: {
          company_id: company_id,
        },
      }
    );

    res.status(201).json({
      message: "Company details updated successfully!",
      company: updatedCompany,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const user_type_mapping_id = req.user.user_type_mapping_id;
    const partnerBuilder = await db.PartnerBuilder.findOne({
      where: { user_type_mapping_id },
    });

    const projects = await partnerBuilderService.getAllProjectsByCompanyId(
      partnerBuilder.company_id
    );

    res.status(200).json({ projects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    // Extract the company_id from the request params
    const { partner_builder_project_id } = req.params;

    const project = await db.PartnerBuilderProject.findByPk(
      partner_builder_project_id
    );

    res.status(200).json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// exports.addProject = async (req, res) => {
//   try {
//     const user_type_mapping_id = req.user.user_type_mapping_id;
//     const partnerBuilder = await db.PartnerBuilder.findOne({
//       where: { user_type_mapping_id },
//     });
//     // console.log(partnerBuilder);

//     // Extract the the required data from the request body
//     const {
//       partner_builder_project_name,
//       address,
//       town,
//       mandal,
//       city,
//       state,
//       country,
//       pincode,
//       payment,
//     } = req.body;

//     console.log(req.body);

//     const existingProject = await db.PartnerBuilderProject.findOne({
//       where: { partner_builder_project_name },
//     });
//     if (existingProject) {
//       throw new Error(
//         "A Project with the same name already exists. Please use a different Project Name."
//       );
//     }

//     const project = await db.PartnerBuilderProject.create({
//       partner_builder_project_name,
//       company_id: partnerBuilder.company_id,
//       address,
//       town,
//       mandal,
//       city,
//       state,
//       country,
//       pincode,
//       payment,
//       status: "Active",
//     });

//     res.status(201).json({ project, message: "Project added successfully!" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };

exports.editProject = async (req, res) => {
  try {
    const { partner_builder_project_id } = req.params;
    // Extract the the required data from the request body
    const {
      partner_builder_project_name,
      address,
      town,
      mandal,
      city,
      state,
      country,
      pincode,
      payment,
    } = req.body;

    const existingProject = await db.PartnerBuilderProject.findOne({
      where: {
        partner_builder_project_name,
        partner_builder_project_id: {
          [Op.not]: partner_builder_project_id,
        },
      },
    });
    if (existingProject) {
      throw new Error(
        "A Project with the same name already exists. Please use a different Project Name."
      );
    }

    const project = await db.PartnerBuilderProject.update(
      {
        partner_builder_project_name,
        address,
        town,
        mandal,
        city,
        state,
        country,
        pincode,
        payment,
      },
      {
        where: { partner_builder_project_id },
      }
    );

    res.status(201).json({ project, message: "Project updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.generateReferenceCode = async (req, res) => {
  try {
    const { property_id } = req.params;
    const property = await db.Property.findByPk(property_id);
    const { partner_builder_project_id, company_id, area, user_id } = property;

    if (user_id) {
      throw new Error("This Property is already assigned to a Customer.");
    }

    const user_type_mapping_id = req.user.user_type_mapping_id;
    const partnerBuilder = await db.PartnerBuilder.findOne({
      where: { user_type_mapping_id, company_id },
    });

    if (!partnerBuilder) {
      throw new Error(
        "You're not authorised to generate reference code for this Property!"
      );
    }

    const commissionForProperty =
      await partnerBuilderService.getCommissionByArea(
        partner_builder_project_id,
        area
      );
    if (!commissionForProperty) {
      throw new Error(
        "To generate reference code please ask Bhuvi to set commission for this Project."
      );
    }

    const reference_code = utils.generateUniqueReferenceCode();
    // const expiryHours = 48;
    const expiryHours = 48;

    const currentTime = new Date();

    // Calculate the expiry date and time (expiryHours hours from the current time)
    const expiryTime = new Date(
      currentTime.getTime() + expiryHours * 60 * 60 * 1000
    ); // 48 hours in milliseconds

    // Format the expiry time as a MySQL DATETIME string
    console.log("expiry-time", expiryTime);
    const reference_code_expiry = expiryTime
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    // const property = await db.Property.update({
    //     reference_code,
    //     reference_code_expiry
    // }, {
    //     where: { property_id }
    // })
    property.reference_code = reference_code;
    property.reference_code_expiry = reference_code_expiry;
    property.save();

    res.status(201).json({
      property,
      reference_code_expiry,
      reference_code,
      message: "Reference Code generated successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getPropertyDetailsForPartnerBuilder = async (req, res) => {
  try {
    const { property_id } = req.params;
    const { user_type_mapping_id } = req.user;
    const partnerBuilder = await db.PartnerBuilder.findOne({
      where: { user_type_mapping_id },
    });
    const company_id = partnerBuilder.company_id;

    const query = `
        SELECT
            p.property_id,
            p.property_name,
            p.description,
            p.area,
            p.address,
            p.town,
            p.mandal,
            p.city,
            p.state,
            p.country,
            p.pincode,
            p.images,
            p.documents,
            p.created_at,
            p.user_id,
            p.is_verified,
            p.lat,
            p.long,
            p.payment,
            pkg.package_id,
            pkg.package_name,
            ps.package_service_id,
            ps.package_service_price,
            pbp.partner_builder_project_name,
            s.service_id,
            s.service_name,
            sub.package_price,
            sub.subscription_id,
            sub.start_date,
            sub.end_date,
        FROM
            property AS p
        LEFT JOIN
            subscription AS sub ON p.property_id = sub.property_id
        LEFT JOIN
            partner_builder_project AS pbp ON p.partner_builder_project_id = pbp.partner_builder_project_id
        LEFT JOIN
            package AS pkg ON sub.package_id = pkg.package_id
        LEFT JOIN
            package_service AS ps ON pkg.package_id = ps.package_id AND ps.is_active = 1
        LEFT JOIN
            service AS s ON ps.service_id = s.service_id AND s.is_active = 1
        WHERE
            p.property_id = :property_id AND p.company_id = :company_id 
        `;

    const propertyDetails = await db.sequelize.query(query, {
      replacements: { property_id, company_id },
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (!propertyDetails || propertyDetails.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    const propertyData = propertyDetails[0];
    // ensure images and documents are in proper json array format 2024-05-13
    // const images = propertyData.images.length ? JSON.parse(propertyData.images) : [];
    // const documents = propertyData.documents.length ? JSON.parse(propertyData.documents) : [];

    let images = await (propertyData.images.length
      ? JSON.parse(propertyData.images)
      : []);
    //  let documents = await (propertyData.documents.length ? JSON.parse(propertyData.documents) : []);
    if (typeof images === "string") {
      images = JSON.parse(images);
    }
    // if (typeof documents === 'string') { documents = JSON.parse(documents) }

    const imageUrls = await Promise.all(
      images.map(async (image) => {
        const imageUrl = await getFileUrl(image);
        return imageUrl;
      })
    );

    // const documentUrls = await Promise.all(
    //    documents.map(async (document) => {
    //        const documentUrl = await getFileUrl(document);
    //        return documentUrl;
    //     })
    //    );

    const packageData = {
      package_id: propertyData.package_id,
      package_name: propertyData.package_name,
      package_price: propertyData.package_price,
      services: propertyDetails.map((row) => ({
        service_id: row.service_id,
        service_name: row.service_name,
        package_service_price: row.package_service_price,
        service_status: row.status,
        task_property_id: row.task_property_id,
        task_id: row.task_id,
      })),
    };

    const subscriptionData = {
      subscription_id: propertyData.subscription_id,
      start_date: propertyData.start_date,
      end_date: propertyData.end_date,
    };

    const propertyDetailsWithUrls = {
      property_id: propertyData.property_id,
      property_name: propertyData.property_name,
      description: propertyData.description,
      area: propertyData.area,
      address: propertyData.address,
      town: propertyData.town,
      mandal: propertyData.mandal,
      city: propertyData.city,
      state: propertyData.state,
      country: propertyData.country,
      pincode: propertyData.pincode,
      payment: propertyData.payment,
      images: images,
      imagesUrls: imageUrls,
      // documents: documents,
      // documentsUrls: documentUrls,
      created_at: propertyData.created_at,
      is_verified: propertyData.is_verified,
      package: packageData,
      subscription: subscriptionData,
      lat: propertyData.lat,
      long: propertyData.long,
      partner_builder_project_name: propertyData.partner_builder_project_name,
    };

    res.status(200).json({ property: propertyDetailsWithUrls });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to fetch property details' });
    res.status(500).json({ message: error.message });
  }
};

exports.getPartnerBuilderUsers = async (req, res) => {
  try {
    const { user_type_mapping_id } = req.user;
    console.log(user_type_mapping_id);

    const partnerBuilder = await db.PartnerBuilder.findOne({
      where: { user_type_mapping_id },
    });
    const company_id = partnerBuilder.company_id;
    console.log(company_id);
    const query = `
        SELECT
            pb.*,
            u.first_name,
            u.last_name,
            u.email,
            u.mobile,
            u.project_id,
            u.dob,
            utm.status,
            utm.created_at,
            utm.unique_id,
            ut.user_type_id,
            ut.user_type_name,
            pbp.partner_builder_project_name,
            pbp.partner_builder_project_id AS pbp_project_id
        FROM
            partner_builder AS pb
        JOIN
            user AS u ON pb.user_id = u.user_id
        JOIN
            user_type_mapping AS utm ON pb.user_type_mapping_id = utm.user_type_mapping_id
        JOIN
            user_type AS ut ON utm.user_type_id = ut.user_type_id
        LEFT JOIN
            partner_builder_project AS pbp ON u.project_id = pbp.partner_builder_project_id
        WHERE
            pb.company_id = :company_id
            AND ut.user_type_name = 'PB Member'; 
        `;
    // const query = `
    //     SELECT
    //         pb.*,
    //         u.first_name,
    //         u.last_name,
    //         u.email,
    //         u.mobile,
    //         utm.status,
    //         utm.created_at,
    //          utm.unique_id,
    //         ut.user_type_id,
    //         ut.user_type_name

    //     FROM
    //         partner_builder AS pb
    //     JOIN
    //         user AS u ON pb.user_id = u.user_id
    //     JOIN
    //         user_type_mapping AS utm ON pb.user_type_mapping_id = utm.user_type_mapping_id
    //     JOIN
    //         user_type AS ut ON utm.user_type_id = ut.user_type_id

    //     WHERE
    //         pb.company_id = :company_id;
    //     `;

    const partnerBuilderUsers = await db.sequelize.query(query, {
      replacements: { company_id },
      type: db.sequelize.QueryTypes.SELECT,
    });

    res.status(200).json({ partnerBuilderUsers });
  } catch (error) {
    console.error("Error in getPartnerBuilderUsers :: ", error);
    res.status(500).json({ message: error.message });
  }
};

exports.addPartnerBuilderUser = async (req, res) => {
  try {
    const { user_type_mapping_id } = req.user;
    const partnerBuilder = await db.PartnerBuilder.findOne({
      where: { user_type_mapping_id },
    });
    const company_id = partnerBuilder.company_id;

    const { projectId } = req.body;
    console.log(projectId);

    // Extract the required data from the request body
    const {
      email,
      password,
      user_type_id,
      first_name,
      last_name,
      mobile,
      status,
      dob,
      gender,
    } = req.body;

    const userType = await db.UserType.findByPk(user_type_id);
    const user_type_category_id = userType.user_type_category_id;

    // Check if the user is trying to add a non-Partner-Builder user
    if (!(user_type_category_id === 5)) {
      throw Error(
        "You are not authorized to add this user role. Please contact the developers."
      );
    }

    const is_admin = 0;
    const is_superadmin = 0;

    // Check if the email already exists
    const existingUser = await db.User.findOne({ where: { email } });
    let user_id;

    if (existingUser) {
      user_id = existingUser.user_id;
      // Check if the user already has the same role already present
      const duplicate = await db.UserTypeMapping.findOne({
        where: {
          user_id,
          user_type_id,
        },
      });

      if (duplicate) {
        throw new Error("This User already has the assigned role.");
      }
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user
      const newUser = await db.User.create({
        first_name,
        last_name,
        username: email,
        email,
        password: hashedPassword,
        mobile,
        project_id: projectId,
        dob,
        gender,
      });

      user_id = newUser.user_id;
    }
    // let countData;
    // console.log("user_type_id=======",user_type_id)
    // if(user_type_id=="5" || user_type_id=="6"){
    //   const queryforcount = `SELECT count( user_id) as count FROM user_type_mapping WHERE (user_type_id) IN (5,6)`;
    //  countData = await db.sequelize.query(queryforcount, {
    //     type: db.sequelize.QueryTypes.SELECT,
    //   });
    // }
    // else{
    //   const queryforcount = `SELECT count(user_id) as count FROM user_type_mapping where user_type_id =  ${user_type_id}  `;
    //   countData = await db.sequelize.query(queryforcount, {
    //     type: db.sequelize.QueryTypes.SELECT,
    //   });
    // }

    const queryforcount = `
        SELECT 
            count(utm.user_id) as count 
        FROM 
            user_type_mapping utm
        LEFT JOIN
            user_type ut ON utm.user_type_id = ut.user_type_id
        WHERE 
            ut.user_type_category_id =  ${user_type_category_id};
        `;

    const countData = await db.sequelize.query(queryforcount, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    const uniqueIdCount = countData[0].count;
    const getCount = uniqueIdCount + 1;
    const idString = getCount.toString().padStart(7, "0");
    const unique_id = "PB" + idString;
    // Insert into user_type_mapping
    const userTypeMapping = await db.UserTypeMapping.create({
      user_id,
      user_type_id,
      is_active: 1,
      unique_id,
      status,
      is_admin,
      is_superadmin,
    });

    // Check if gender, city, or state exist in req.body
    if (req.body.gender || req.body.city || req.body.state) {
      // Create the user profile object
      const userProfileData = {
        user_id,
        first_name,
        last_name,
        email,
        mobile,
        current_city: req.body.city || null,
        current_state: req.body.state || null,
        gender: req.body.gender || null,
      };

      // Create the user profile record
      await db.UserProfile.create(userProfileData);
    }

    const newPartnerBuilder = await partnerBuilderService.addPartnerBuilder(
      user_id,
      userTypeMapping.user_type_mapping_id,
      company_id
    );

    res.status(201).json({ message: "User added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.editPartnerBuilderUser = async (req, res) => {
  try {
    // Extract the user ID from the request parameters
    const { user_id } = req.params;

    // Extract the updated data from the request body
    const {
      first_name,
      last_name,
      email,
      user_type_id,
      user_type_mapping_id,
      mobile,
      status,
      projectId,
      dob,
    } = req.body;

    const userType = await db.UserType.findByPk(user_type_id);

    if (!(userType.user_type_category_id === 5)) {
      throw Error(
        "You are not authorised to edit to this user role. Please contact the developers."
      );
    }

    const existingUser = await db.User.findOne({
      where: {
        email,
        user_id: {
          [Op.not]: user_id,
        },
      },
    });

    if (existingUser) {
      throw new Error("Email already exists");
    }

    // Find the user in the database
    const user = await db.User.findByPk(user_id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's data in the database
    await user.update({
      first_name,
      last_name,
      email,
      mobile,
      project_id: projectId,
      dob,
    });

    if (user_type_id > 1) {
      const user_type_mapping = await db.UserTypeMapping.findByPk(
        user_type_mapping_id
      );
      const is_admin = user_type_id == 2 ? 1 : 0;
      const is_superadmin = 0;

      // Check if the user already has the same role already present
      const duplicate = await db.UserTypeMapping.findOne({
        where: {
          user_id,
          user_type_id,
          user_type_mapping_id: {
            [Op.not]: user_type_mapping_id,
          },
        },
      });

      if (duplicate) {
        throw new Error("This User already has the assigned role.");
      }

      await user_type_mapping.update({
        is_admin,
        is_superadmin,
        status,
        user_type_id,
      });
    }

    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to update user' });
    res.status(500).json({ message: error.message });
  }
};

exports.partnerBuilderDashboard = async (req, res) => {
  try {
    const { user_type_mapping_id, user_type_category_id } = req.user;
    let company_id;

    if (user_type_category_id === 1 || user_type_category_id === 2) {
      company_id = req.query.company_id;
    } else {
      const partnerBuilder = await db.PartnerBuilder.findOne({
        where: { user_type_mapping_id },
      });
      company_id = partnerBuilder.company_id;
    }

    const query = `
        SELECT
            sub.start_date,
            sub.commission,
            p.property_name,
            p.area,
            p.payment,
            u.first_name,
            u.last_name,
            pbp.partner_builder_project_name,
            u.user_id as customer_id,
            (SELECT 
                SUM(commission) FROM subscription 
                WHERE company_id = ${company_id} AND commission IS NOT NULL 
                GROUP BY company_id) AS total_commission,
            (SELECT COUNT(*) FROM property where company_id = ${company_id}) AS total_properties,
            (SELECT COUNT(*) FROM subscription where company_id = ${company_id} AND commission IS NOT NULL) AS converted_properties
        FROM
            subscription AS sub
        LEFT JOIN
            property AS p ON sub.property_id = p.property_id
        LEFT JOIN
            partner_builder_project pbp  ON pbp.partner_builder_project_id = p.partner_builder_project_id
        LEFT JOIN
            user AS u ON sub.user_id = u.user_id
        WHERE
            p.company_id = ${company_id}
            AND sub.commission IS NOT NULL
        GROUP BY
            sub.start_date,
            sub.commission,
            p.property_name,
            p.area,
            p.payment,
            u.first_name,
            u.last_name,
            pbp.partner_builder_project_name,
            u.user_id
        `;

    let properties = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (!properties.length) {
      const query2 = `SELECT COUNT(*) AS total_properties FROM property where company_id = ${company_id}`;
      const total_properties = await db.sequelize.query(query2, {
        type: db.sequelize.QueryTypes.SELECT,
      });
      properties.push({
        total_properties: total_properties[0]["total_properties"] || 0,
        converted_properties: 0,
        total_commission: 0,
      });
    }

    res.status(200).json({ properties });
  } catch (error) {
    console.error("Error in partnerBuilderDashboard :: ", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getPartnerBuilderProjectsListWithCompany = async (req, res) => {
  try {
    const { user_type_mapping_id } = req.body;

    if (!user_type_mapping_id) {
      return res.status(400).json({
        message: "user_type_mapping_id is required",
        success: false,
      });
    }

    const result = await sequelize.transaction(async (t) => {
      const query = `SELECT * FROM partner_builder WHERE user_type_mapping_id=?`;
      const partnerBuilderData = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        replacements: [user_type_mapping_id],
        transaction: t,
        raw: true,
      });

      if (!partnerBuilderData || partnerBuilderData.length === 0) {
        return {
          partner_builder_data: [],
          projectsbasedoncompany: [],
        };
      }

      const company_id = partnerBuilderData[0].company_id;

      const projectListQuery = `SELECT * FROM partner_builder_project WHERE company_id=?`;
      const projectListBasedOnCompany = await sequelize.query(
        projectListQuery,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: [company_id],
          transaction: t,
          raw: true,
        }
      );

      return {
        partner_builder_data: partnerBuilderData,
        projectsbasedoncompany: projectListBasedOnCompany,
      };
    });

    return res.status(200).json({
      message: "Franchise partner fetched successfully",
      success: true,
      partnerBasedProjects: result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getUsersBillingListByPartnerBuilder = async (req, res) => {
  try {
    const { user_id } = req.body;
    const BILLING_LIST_QUERY_FOR_USER = `SELECT rp.*,s.*, p.*, u.first_name, u.last_name, u.email, utm.* FROM payment rp 
INNER JOIN subscription s ON s.subscription_id = rp.subscription_id
INNER JOIN property p ON p.property_id = s.property_id
INNER JOIN package pkg ON pkg.package_id = s.package_id
INNER JOIN user u ON u.user_id = rp.user_id
INNER JOIN user_type_mapping utm  ON utm.user_id = rp.user_id
INNER JOIN user_type ut ON ut.user_type_id = utm.user_type_id
WHERE rp.user_id = ? AND ut.user_type_name = 'PB Member'`;
    const rows = await sequelize.query(BILLING_LIST_QUERY_FOR_USER, {
      replacements: [user_id],
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });
    const result_data = rows;

    const final_result = await result_data.map((result) => {
      const user_details = {
        first_name: result.first_name,
        last_name: result.last_name,
        email: result.email,
        user_id: result.user_id,
        unique_id: result.unique_id,
      };

      const razorpay_payment_details = {
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_order_id: result.razorpay_order_id,
        order_amount: result.order_amount,
        order_gst_amount: result.order_gst,
      };

      const property_details = {
        property_id: result.property_id,
        property_name: result.property_name,
        prop_unique_id: result.prop_unique_id,
      };

      const invoice_details = {
        invoice_id: result.invoice_no,
        invoice_to_name: result.invoice_to_name,
        invoice_area: result.invoice_area,
        invoice_to_town: result.invoice_to_town,
        invoice_to_mandal: result.invoice_to_mandal,
        invoice_to_city: result.invoice_to_city,
        invoice_to_state: result.invoice_to_state,
        invoice_to_pincode: result.invoice_to_pincode,
        invoice_property_address: result.invoice_property_address,
        invoice_to_mobile: result.invoice_to_mobile,
        invoice_to_email: result.invoice_to_email,
      };

      return {
        user_details,
        razorpay_payment_details,
        property_details,
        invoice_details,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Data Retrived Successfully..!",
      billing: final_result,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

exports.createProject = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const user_type_mapping_id = req.user.user_type_mapping_id;

    // Step 1: Get company_id from PartnerBuilder
    const [partnerBuilder] = await sequelize.query(
      `SELECT company_id FROM partner_builder WHERE user_type_mapping_id = :user_type_mapping_id`,
      {
        replacements: { user_type_mapping_id },
        type: sequelize.QueryTypes.SELECT,
        transaction,
      }
    );

    if (!partnerBuilder) {
      throw new Error("Partner Builder not found for the given user.");
    }

    // Extract data from request body
    const {
      partner_builder_project_name,
      address,
      town,
      mandal,
      city,
      state,
      country,
      pincode,
      payment,
    } = req.body;

    // Step 2: Check if project name already exists
    const [existingProject] = await sequelize.query(
      `SELECT partner_builder_project_id FROM partner_builder_project WHERE partner_builder_project_name = :partner_builder_project_name`,
      {
        replacements: { partner_builder_project_name },
        type: sequelize.QueryTypes.SELECT,
        transaction,
      }
    );

    if (existingProject) {
      throw new Error(
        "A Project with the same name already exists. Please use a different Project Name."
      );
    }

    // Step 3: Insert new project
    const [result] = await sequelize.query(
      `INSERT INTO partner_builder_project (
        partner_builder_project_name,
        company_id,
        address,
        town,
        mandal,
        city,
        state,
        country,
        pincode,
        payment,
       
        created_at,
        updated_at
      ) VALUES (
        :partner_builder_project_name,
        :company_id,
        :address,
        :town,
        :mandal,
        :city,
        :state,
        :country,
        :pincode,
        :payment,
       
        NOW(),
        NOW()
      ) ;`,
      {
        replacements: {
          partner_builder_project_name,
          company_id: partnerBuilder.company_id,
          address,
          town,
          mandal,
          city,
          state,
          country,
          pincode,
          payment,
        },
        type: sequelize.QueryTypes.INSERT,
        transaction,
      }
    );

    const [newProject] = await sequelize.query(
      `SELECT * FROM partner_builder_project WHERE partner_builder_project_id = LAST_INSERT_ID()`,
      {
        type: sequelize.QueryTypes.SELECT,
        transaction,
      }
    );

    const prefix = partner_builder_project_name.substring(0, 3).toUpperCase();
    const paddedId = String(newProject.partner_builder_project_id).padStart(
      3,
      "0"
    );
    const uniqueCode = `${prefix}${paddedId}`;

    // Step 6: Update project with unique code
    await sequelize.query(
      `UPDATE partner_builder_project SET project_unique_id = :uniqueCode WHERE partner_builder_project_id = :id`,
      {
        replacements: { uniqueCode, id: newProject.partner_builder_project_id },
        transaction,
      }
    );

    await transaction.commit();

    res.status(201).json({
      project: newProject,
      message: "Project added successfully!",
      project_code: uniqueCode,
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCompanyDetailsByUserId = async (req, res) => {
  try {
    const { user_id } = req.body;

    const GET_COMPANY_DETAILS_BY_USER_ID = `SELECT c.* FROM company c  
    INNER JOIN partner_builder pb ON pb.company_id = c.company_id 
    WHERE pb.user_id = ?`;

    const [company] = await sequelize.query(GET_COMPANY_DETAILS_BY_USER_ID, {
      replacements: [user_id],
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    return res
      .status(200)
      .json({ message: "company details fetched successfully", company });
  } catch (error) {
    console.log(error);
    
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

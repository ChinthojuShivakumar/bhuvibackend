// src/controllers/adminController.js
const db = require("../models");
const bcrypt = require("bcrypt");
const { getFileUrl } = require("../utils/utils");
const { createTasks } = require("../services/taskService");
const { sendEmail } = require("../services/emailService");
const partnerBuilderService = require("../services/partnerBuilderService");
const channelPartnerService = require("../services/channelPartnerService");
const { Op, where } = require("sequelize");
const { addPackage } = require("../services/packageService");
const { getDDYY } = require("../utils/utils");
const { generateInvoiceNumber } = require("../services/documentService");
// const puppeteer = require("puppeteer");
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");
const chromium = require("playwright");
const { Sequelize } = require("sequelize");
const PartnerBuilderServices = require("../services/partnerBuilderService.js");

const dotenv = require("dotenv");

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

exports.getAllUsers = async (req, res) => {
  try {
    const { user_type_id } = req.query;

    let whereClause = "WHERE u.is_active = 1";
    let replacements = {};

    if (user_type_id) {
      whereClause += " AND utm.user_type_id = :user_type_id";
      replacements.user_type_id = parseInt(user_type_id);
    }

    const query = `
      SELECT u.user_id, u.first_name, u.last_name, utm.user_type_mapping_id,utm.unique_id
      FROM user u
      LEFT JOIN user_type_mapping utm ON u.user_id = utm.user_id
      ${whereClause}
    `;

    const users = await db.sequelize.query(query, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT,
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getUsersWithDetails = async (req, res) => {
  try {
    const { user_type_id } = req.query;

    let whereClause = "WHERE utm.is_active = 1";
    let replacements = {};

    if (user_type_id) {
      whereClause += " AND utm.user_type_id = :user_type_id";
      replacements.user_type_id = parseInt(user_type_id);
    }

    const query = `
      SELECT 
        u.user_id, 
        u.first_name, 
        u.last_name, 
        u.email,
        u.mobile, 
        u.dob,
        utm.user_type_id, 
        utm.created_at, 
        utm.status,
        ut.user_type_name,
        utm.user_type_mapping_id,
        utm.unique_id
      FROM user u
      LEFT JOIN user_type_mapping utm ON u.user_id = utm.user_id
      LEFT JOIN user_type ut ON utm.user_type_id = ut.user_type_id
      ${whereClause}
      ORDER BY u.user_id DESC
    `;

    const users = await db.sequelize.query(query, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT,
    });

    const usersWithDetails = users.map((user) => ({
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      mobile: user.mobile,
      email: user.email,
      user_type_id: user.user_type_id,
      created_at: user.created_at,
      status: user.status,
      full_name: `${user.first_name} ${user.last_name}`,
      user_type_name: user.user_type_name,
      user_type_mapping_id: user.user_type_mapping_id,
      unique_id: user.unique_id,
      dob: user.dob,
    }));

    res.json(usersWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.addUser = async (req, res) => {
  try {
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
      company_name,
    } = req.body;

    // Check if the user is trying to add a Super Admin
    if (user_type_id == 1) {
      throw Error(
        "You are not authorized to add a Super Admin. Please contact the developers."
      );
    }

    const is_admin = user_type_id == 2 ? 1 : 0;
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
          // user_type_id,
        },
      });

      if (duplicate) {
        throw new Error("This User already has the assigned role.");
      }
      // if(password){
      //   const hashedPassword = await bcrypt.hash(password,10)
      //   await db.User.update({password:hashedPassword},{where:{user_id}})
      // }
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
        dob,
      });

      user_id = newUser.user_id;
    }

    const userType = await db.UserType.findByPk(user_type_id);
    const user_type_category_id = userType.user_type_category_id;
    console.log("user_type_category_id====" + user_type_category_id);
    // if(user_type_id=="5" || user_type_id=="6" || user_type_id=="51"){
    //   console.log("user_type_id=======",user_type_id)
    //   const queryforcount = `SELECT count( user_id) as count FROM user_type_mapping WHERE (user_type_id) IN (5,6,51)`;
    //  countData = await db.sequelize.query(queryforcount, {
    //     type: db.sequelize.QueryTypes.SELECT,
    //   });
    // }
    // else{
    // const queryforcount = `SELECT count(user_id) as count FROM user_type_mapping where user_type_id =  ${user_type_id}  `;
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
    // }

    const uniqueIdCount = countData[0].count;
    const getCount = uniqueIdCount + 1;
    const idString = getCount.toString().padStart(7, "0");
    let unique_id = null;
    //  if(user_type_id=="3"){
    if (user_type_category_id === 3) {
      unique_id = "CU" + idString;
      //  }else if(user_type_id=="4"){
    } else if (user_type_category_id === 4) {
      unique_id = "BA" + idString;
      //  }else if(user_type_id=="9"){
    } else if (user_type_category_id === 6) {
      unique_id = "CP" + idString;
      //  }else if (user_type_id=="5" || user_type_id=="6" || user_type_id=="51"){
    } else if (user_type_category_id === 5) {
      unique_id = "PB" + idString;
    }
    console.log("Final unique_id===", unique_id);
    // Insert into user_type_mapping
    const userTypeMapping = await db.UserTypeMapping.create({
      user_id,
      user_type_id,
      is_active: 1,
      status,
      unique_id,
      is_admin,
      is_superadmin,
    });
    const user_type_mapping_id = userTypeMapping.user_type_mapping_id;

    if (user_type_category_id === 6) {
      await channelPartnerService.addChannelPartnerByAdmin(
        user_type_mapping_id
      );
    }

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

    if (req.body.user_type_id == 5) {
      const companyData = {
        company_name: req.body.company_name,
      };
      const newCompany = await PartnerBuilderServices.addCompany(companyData);
      await partnerBuilderService.addPartnerBuilder(
        user_id,
        user_type_mapping_id,
        newCompany.company_id
      );
    }

    res.status(201).json({ message: "User added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Edit an existing user
exports.editUser = async (req, res) => {
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
    } = req.body;

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

    if (user_type_id == 1) {
      throw Error(
        "You are not authorised to add a Super Admin. Please contact the developers."
      );
    }

    // Update the user's data in the database
    await user.update({
      first_name,
      last_name,
      email,
      mobile,
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

// Edit an existing user password
exports.editUserPassword = async (req, res) => {
  try {
    // Extract the user ID from the request parameters
    const { user_id } = req.params;
    const { user_id: admin_user_id } = req.user;

    // Extract the updated data from the request body
    const { password, otp } = req.body;

    const adminUser = await db.User.findByPk(admin_user_id);
    const email_otp = adminUser.email_otp;

    if (parseInt(otp) !== parseInt(email_otp)) {
      return res.status(401).json({ error: "Incorrect OTP" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find the user in the database
    const user = await db.User.findByPk(user_id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's data in the database
    await user.update({ password: hashedPassword });

    res
      .status(200)
      .json({ message: "User Password updated successfully", user });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to update user' });
    res.status(500).json({ message: error.message });
  }
};

// Get all user types with corresponding user type permissions
exports.getAllUserTypes = async (req, res) => {
  try {
    // Find all user types with their corresponding user type permissions
    const userTypes = await db.UserType.findAll({
      where: { is_active: 1 },
      // include: [
      //   {
      //     model: db.UserTypePermission,
      //     where: { is_active: 1 },
      //     attributes: [
      //       'permission_id',
      //       'is_view',
      //       'is_add',
      //       'is_edit',
      //       'is_delete',
      //       'created_at',
      //       'updated_at',
      //     ],
      //     include: [
      //       {
      //         model: db.Permission,
      //         attributes: ['permission_name'],
      //       },
      //     ],
      //   },
      // ],
    });

    res.status(200).json({ userTypes });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to get user types' });
    res.status(500).json({ message: error.message });
  }
};

// Add a new user type with corresponding permissions
exports.addUserType = async (req, res) => {
  try {
    // const { user_type_name, permissions, status, user_type_category_id } = req.body;
    const { user_type_name, permissions, status } = req.body;
    const { user_id } = req.user;

    const user_type_category_id = 4;
    const user_type_category_name = "Agent";

    const user_type_exists = await db.UserType.findOne({
      where: { user_type_name },
    });
    if (user_type_exists) {
      throw new Error("User Role already exists.");
    }

    // Create a new user type
    const userType = await db.UserType.create({
      user_type_category_id,
      user_type_category_name,
      user_type_name,
      status,
      created_by: user_id,
      last_update_by: user_id,
    });

    // // Create user type permissions
    // const userTypePermissions = permissions.map(permission => ({
    //   user_type_id: userType.user_type_id,
    //   permission_id: permission.permission_id,
    //   is_view: permission.is_view,
    //   is_add: permission.is_add,
    //   is_edit: permission.is_edit,
    //   is_delete: permission.is_delete,
    //   created_by: user_id,
    //   last_update_by: user_id,
    // }));

    // // Bulk insert user type permissions
    // await db.UserTypePermission.bulkCreate(userTypePermissions);

    res.status(201).json({ message: "User type added successfully" });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to add user type' });
    res.status(500).json({ message: error.message });
  }
};

// Edit an existing user type with corresponding permissions
exports.editUserType = async (req, res) => {
  try {
    const { user_type_id } = req.params;
    const { user_type_name, status, permissions } = req.body;
    const { user_id } = req.user;

    if (parseInt(user_type_id) <= 5) {
      throw Error(
        "You are not authorised to edit Super Admin, Admin and Customer user roles. Please contact the developers"
      );
    }

    const user_type_exists = await db.UserType.findOne({
      where: {
        user_type_name,
        user_type_id: {
          [Op.not]: user_type_id,
        },
      },
    });
    if (user_type_exists) {
      throw new Error("User Role already exists.");
    }

    // Update the user type
    await db.UserType.update(
      {
        user_type_name,
        status,
        last_update_by: user_id,
      },
      {
        where: { user_type_id },
      }
    );

    // const existingUserTypePermissions = await db.UserTypePermission.findOne({where: { user_type_id, is_active: 1 }})

    // const created_by = existingUserTypePermissions.created_by || user_id

    // // Update user type permissions
    // const userTypePermissions = permissions.map(permission => ({
    //   user_type_id,
    //   permission_id: permission.permission_id,
    //   is_view: permission.is_view,
    //   is_add: permission.is_add,
    //   is_edit: permission.is_edit,
    //   is_delete: permission.is_delete,
    //   created_by,
    //   last_update_by: user_id,
    // }));

    // // Bulk update user type permissions
    // await db.UserTypePermission.bulkCreate(userTypePermissions, {
    //   updateOnDuplicate: [
    //     'is_view',
    //     'is_add',
    //     'is_edit',
    //     'is_delete',
    //     'last_update_by',
    //   ],
    // });

    res.status(200).json({ message: "User type updated successfully" });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to update user type' });
    res.status(500).json({ message: error.message });
  }
};

// Get all permissions with specified fields
exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await db.Permission.findAll({
      attributes: [
        "permission_id",
        "permission_category_id",
        "permission_name",
        "is_category",
      ],
      where: { is_active: 1 },
    });

    res.status(200).json({ permissions });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to fetch permissions' });
    res.status(500).json({ message: error.message });
  }
};

// Get all properties from all users
exports.getAllProperties = async (req, res) => {
  try {
    const { user_id, town, mandal, city } = req.query;

    let where = { is_active: 1 };
    if (user_id) {
      where = { ...where, user_id: parseInt(user_id) };
    }
    if (town) {
      where = { ...where, town };
    }
    if (mandal) {
      where = { ...where, mandal };
    }
    if (city) {
      where = { ...where, city };
    }

    const properties = await db.Property.findAll({
      // attributes: ['property_id', 'property_name', 'description', 'address', 'town', 'mandal', 'city', 'state',
      // 'country', 'pincode', 'images', 'documents', 'created_at', 'user_id', 'is_verified'],
      include: [
        {
          model: db.User,
          attributes: ["user_id", "first_name", "last_name", "email", "mobile"],
          as: "user",
        },
        {
          model: db.PartnerBuilderProject,
          attributes: ["partner_builder_project_name"],
          as: "partner_builder_project",
        },
        {
          model: db.Company,
          attributes: ["company_name"],
          as: "company",
        },

        {
          model: db.Package,
          attributes: ["package_id", "package_name"],
          required: false,
          as: "package",
          on: {
            col1: Sequelize.where(
              Sequelize.col("Property.package_id"),
              "=",
              Sequelize.col("package.package_id")
            ),
          },
        },
      ],
      where,
      order: [["property_id", "DESC"]],
    });

    const propertiesWithFiles = await Promise.all(
      properties.map(async (property) => {
        const propertyData = property.toJSON();
        // ensure images and documents are in proper json array format 2024-05-13
        //const images = await (propertyData.images.length ? JSON.parse(propertyData.images) : []);
        //const documents = await (propertyData.documents.length ? JSON.parse(propertyData.documents) : []);
        let images = await (propertyData?.images?.length
          ? JSON.parse(propertyData?.images)
          : []);
        let documents = await (propertyData?.documents?.length
          ? JSON.parse(propertyData?.documents)
          : []);
        if (typeof images === "string") {
          images = JSON.parse(images);
        }
        if (typeof documents === "string") {
          documents = JSON.parse(documents);
        }

        const imageUrls = await Promise.all(
          images.map(async (image) => {
            const imageUrl = await getFileUrl(image);
            return imageUrl;
          })
        );

        const documentUrls = await Promise.all(
          documents.map(async (document) => {
            const documentUrl = await getFileUrl(document);
            return documentUrl;
          })
        );

        propertyData.images = images;
        propertyData.imagesUrls = imageUrls;
        propertyData.documents = documents;
        propertyData.documentsUrls = documentUrls;

        return propertyData;
      })
    );

    res.status(200).json({ properties: propertiesWithFiles });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to fetch properties' });
    res.status(500).json({ message: error.message });
  }
};

// Get all Services
exports.getAllServices = async (req, res) => {
  try {
    const services = await db.Service.findAll({ where: { is_active: 1 } });

    res.status(200).json({ services });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to fetch Services' });
    res.status(500).json({ message: error.message });
  }
};

// Get all Packages with Services
exports.getAllPackagesWithServices = async (req, res) => {
  try {
    const { user_type_category_id } = req.user;

    const { running } = req.params;

    let where;
    if (
      (user_type_category_id === 1 || user_type_category_id === 2) &&
      !running
    ) {
      where = { is_active: 1 };
    } else {
      where = {
        is_active: 1,
        [Op.and]: [
          {
            [Op.or]: [
              {
                start_date: {
                  [Op.is]: null,
                },
              },
              {
                start_date: {
                  [Op.lte]: new Date(),
                },
              },
            ],
          },
          {
            [Op.or]: [
              {
                end_date: {
                  [Op.is]: null,
                },
              },
              {
                end_date: {
                  [Op.gte]: new Date(),
                },
              },
            ],
          },
        ],
      };
    }
    const packages = await db.Package.findAll({
      include: [
        {
          model: db.PackageService,
          attributes: ["package_service_id", "package_service_price"],
          include: [
            {
              model: db.Service,
              attributes: ["service_id", "service_name", "service_price"],
              as: "Service",
              where: { is_active: 1 },
            },
          ],
          as: "PackageServices",
          where: { is_active: 1 },
        },
      ],
      where,
    });

    const formattedPackages = packages.map((package) => {
      const packageData = {
        parent_id: package.parent_id,
        package_id: package.package_id,
        package_name: package.package_name,
        start_date: package.start_date,
        end_date: package.end_date,
        package_price: package.package_price,
        package_price_1: package.package_price_1,
        package_price_2: package.package_price_2,
        package_price_3: package.package_price_3,
        package_price_4: package.package_price_4,
        package_price_5: package.package_price_5,
        package_price_6: package.package_price_6,
        package_price_7: package.package_price_7,
        package_price_8: package.package_price_8,
        package_price_9: package.package_price_9,
        slab_1: package.slab_1,
        slab_2: package.slab_2,
        slab_3: package.slab_3,
        slab_4: package.slab_4,
        slab_5: package.slab_5,
        slab_6: package.slab_6,
        slab_7: package.slab_7,
        slab_8: package.slab_8,
        slab_9: package.slab_9,
        status: package.status,
        package_services: package.PackageServices.map((packageService) => ({
          package_service_id: packageService.package_service_id,
          package_service_price: packageService.package_service_price,
          service: {
            service_id: packageService.Service.service_id,
            service_name: packageService.Service.service_name,
            service_price: packageService.Service.service_price,
          },
        })),
      };

      return packageData;
    });

    res.status(200).json(formattedPackages);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to get packages' });
    res.status(500).json({ message: error.message });
  }
};

// Add Service
exports.addService = async (req, res) => {
  try {
    const { service_name, service_price, description, status } = req.body;
    const { user_id } = req.user;

    if (!service_name) {
      throw new Error("service name required!");
    }

    // Check if service_name already exists and throw an error if it does
    const serviceExists = await db.Service.findOne({
      where: { service_name, is_active: 1 },
    });
    if (serviceExists) {
      throw new Error("Service Name already exists.");
    }

    // Create a new service
    const service = await db.Service.create({
      service_name: service_name,
      service_price: null,
      description: description,
      status: status,
      created_by: user_id,
      last_update_by: user_id,
    });

    res.status(200).json({ message: "Service added successfully" });
  } catch (error) {
    console.error("Error saving service:", error);
    // res.status(500).json({ error: 'An error occurred while saving the service' });
    res.status(500).json({ message: error.message });
  }
};

// Edit Service
exports.editService = async (req, res) => {
  try {
    const { service_name, service_price, description, status } = req.body;
    const { service_id } = req.params;
    const { user_id } = req.user;

    // Check if service_name already exists and throw an error if it does
    const serviceExists = await db.Service.findOne({
      where: {
        service_name,
        is_active: 1,
        service_id: {
          [Op.not]: service_id,
        },
      },
    });
    if (serviceExists) {
      throw new Error("Service Name already exists.");
    }

    // Find the service by its ID
    const service = await db.Service.findByPk(service_id);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Build the updated service object
    const updatedService = {
      service_name: service_name || service.service_name,
      service_price: service_price || service.service_price,
      description: description || service.description,
      status: status || service.status,
      last_update_by: user_id,
    };

    // Update the service with the new values
    await service.update(updatedService);

    res.status(200).json({ message: "Service updated successfully" });
  } catch (error) {
    console.error("Error updating service:", error);
    // res.status(500).json({ error: 'An error occurred while updating the service' });
    res.status(500).json({ message: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { service_id } = req.params;

    // Check if service exists
    const service = await db.Service.findByPk(service_id);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Delete related package services first
    await db.PackageService.destroy({
      where: { service_id },
    });

    // Delete the service
    const deletedService = await db.Service.destroy({
      where: { service_id },
    });

    if (deletedService) {
      return res.status(200).json({
        message: "Service deleted successfully",
        success: true,
      });
    } else {
      return res.status(400).json({
        message: "Service deletion failed",
        success: false,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Add Package
exports.addPackage = async (req, res) => {
  try {
    const {
      package_name,
      package_price,
      package_price_1,
      package_price_2,
      package_price_3,
      package_price_4,
      package_price_5,
      package_price_6,
      package_price_7,
      package_price_8,
      package_price_9,
      description,
      status,
      package_services,
      slab_1,
      slab_2,
      slab_3,
      slab_4,
      slab_5,
      slab_6,
      slab_7,
      slab_8,
      slab_9,
      start_date,
      end_date,
      parent_id,
    } = req.body;

    const { user_id } = req.user;

    // Check if package_name already exists and throw an error if it does
    const packageExists = await db.Package.findOne({
      where: {
        package_name: package_name,
        is_active: 1,
        [Op.and]: [
          {
            package_id: {
              [Op.ne]: parent_id, // package_id != 1
            },
            parent_id: {
              [Op.ne]: parent_id, // parent_id != 1
            },
          },
          {
            [Op.or]: [
              {
                end_date: {
                  [Op.is]: null, // end_date is NULL
                },
              },
              {
                end_date: {
                  [Op.gte]: new Date(), // end_date >= current_date
                },
              },
            ],
          },
        ],
      },
    });
    if (packageExists) {
      throw new Error("Package Name already exists.");
    }

    // // Create a new package
    // const package = await db.Package.create({
    //   package_name,
    //   package_price,
    //   package_price_1,
    //   package_price_2,
    //   package_price_3,
    //   package_price_4,
    //   package_price_5,
    //   package_price_6,
    //   package_price_7,
    //   package_price_8,
    //   package_price_9,
    //   description,
    //   status,
    //   slab_1,
    //   slab_2,
    //   slab_3,
    //   slab_4,
    //   slab_5,
    //   slab_6,
    //   slab_7,
    //   slab_8,
    //   slab_9,
    //   package_services,
    //   created_by: user_id,
    //   last_update_by: user_id,
    //   start_date: start_date || null,
    //   end_date: end_date || null,
    //   parent_id: parent_id || null
    // });

    // // Add services to the package
    // for (const package_service of package_services) {
    //   await db.PackageService.create({
    //     package_id: package.package_id,
    //     service_id: package_service.service_id,
    //     package_service_price: package_service.package_service_price,
    //     created_by: user_id,
    //     last_update_by: user_id
    //   });
    // }
    const package = await addPackage(req.body, user_id);

    if (parent_id && start_date) {
      const parentPackage = await db.Package.update(
        {
          end_date: start_date,
          last_update_by: user_id,
        },
        {
          where: { package_id: parent_id },
        }
      );
    }

    res.status(200).json({ message: "Package added successfully" });
  } catch (error) {
    console.error("Error saving package:", error);
    // res.status(500).json({ error: 'An error occurred while saving the package' });
    res.status(500).json({ message: error.message });
  }
};

// Edit Package
exports.editPackage = async (req, res) => {
  try {
    const { package_id } = req.params;
    const {
      package_name,
      package_price,
      package_price_1,
      package_price_2,
      package_price_3,
      package_price_4,
      package_price_5,
      package_price_6,
      package_price_7,
      package_price_8,
      package_price_9,
      description,
      status,
      slab_1,
      slab_2,
      slab_3,
      slab_4,
      slab_5,
      slab_6,
      slab_7,
      slab_8,
      slab_9,
      package_services,
      start_date,
      end_date,
      parent_id,
    } = req.body;

    const { user_id } = req.user;

    // Check if package_name already exists and throw an error if it does
    const packageExists = await db.Package.findOne({
      where: {
        package_name: package_name,
        is_active: 1,
        [Op.and]: [
          {
            package_id: {
              [Op.ne]: package_id,
            },
          },
          {
            package_id: {
              [Op.ne]: parent_id,
            },
          },
          {
            parent_id: {
              [Op.ne]: package_id,
            },
          },
          {
            [Op.or]: [
              {
                end_date: {
                  [Op.is]: null,
                },
              },
              {
                end_date: {
                  [Op.gte]: new Date(),
                },
              },
            ],
          },
        ],
      },
    });

    if (packageExists) {
      throw new Error("Package Name already exists.");
    }

    // Find the package by its ID
    const package = await db.Package.findByPk(package_id);

    if (!package) {
      return res.status(404).json({ error: "Package not found" });
    }

    const startDate = start_date ? new Date(start_date) : start_date;
    const endDate = end_date ? new Date(end_date) : end_date;
    const today = new Date();

    // Setting time to midnight for both dates to ensure accurate comparison
    if (startDate) {
      startDate.setHours(0, 0, 0, 0);
    }
    if (endDate) {
      endDate.setHours(0, 0, 0, 0);
    }

    console.error("currDate :: ");
    console.error("currDate :: ");
    console.error(today);
    console.error("start_date ::");
    console.error("start_date ::");
    console.error(startDate);
    console.error("endDate :: ");
    console.error("endDate :: ");
    console.error(endDate);
    console.error("currDate < start_date ::");
    console.error("currDate < start_date ::");
    console.error(today < start_date);

    if ((!startDate || startDate <= today) && (!endDate || endDate >= today)) {
      console.error(
        "Creating a new entry for running package and updating is_active to 0 for current entry"
      );
      await package.update({ is_active: 0 });
      const data = {
        package_name,
        package_price,
        package_price_1,
        package_price_2,
        package_price_3,
        package_price_4,
        package_price_5,
        package_price_6,
        package_price_7,
        package_price_8,
        package_price_9,
        description,
        status,
        slab_1,
        slab_2,
        slab_3,
        slab_4,
        slab_5,
        slab_6,
        slab_7,
        slab_8,
        slab_9,
        package_services,
        start_date,
        end_date,
        parent_id: package.package_id,
      };
      const updatedPackage = await addPackage(data, user_id);
      if (end_date) {
        const childPackage = await db.Package.update(
          {
            parent_id: updatedPackage.package_id,
          },
          { where: { parent_id: package_id } }
        );
      }
    } else if (endDate && endDate < today) {
      throw new Error("You can not update an expired package.");
    } else {
      // Update the package properties
      await package.update({
        package_name,
        package_price,
        package_price_1,
        package_price_2,
        package_price_3,
        package_price_4,
        package_price_5,
        package_price_6,
        package_price_7,
        package_price_8,
        package_price_9,
        description,
        status,
        slab_1,
        slab_2,
        slab_3,
        slab_4,
        slab_5,
        slab_6,
        slab_7,
        slab_8,
        slab_9,
        last_update_by: user_id,
        start_date: start_date || null,
        end_date: end_date || null,
      });

      await db.sequelize.query(
        `
      UPDATE package_service
      SET is_active = 0
      WHERE package_id = :package_id AND is_active = 1
      `,
        {
          replacements: { package_id: package_id },
          type: db.sequelize.QueryTypes.UPDATE,
        }
      );

      const packageServices = package_services.map((package_service) => ({
        package_id: package.package_id,
        service_id: package_service.service_id,
        package_service_price: package_service.package_service_price,
        created_by: package.created_by,
        last_update_by: user_id,
      }));

      // Create new package services
      await db.PackageService.bulkCreate(packageServices);

      if (parent_id && start_date) {
        const parentPackage = await db.Package.update(
          {
            end_date: start_date,
            last_update_by: user_id,
          },
          {
            where: { package_id: parent_id },
          }
        );
      }
    }

    res.status(200).json({ message: "Package updated successfully" });
  } catch (error) {
    console.error("Error updating package:", error);
    // res.status(500).json({ error: 'An error occurred while updating the package' });
    res.status(500).json({ message: error.message });
  }
};

// admin dashboard
exports.adminDashboard = async (req, res) => {
  try {
    const tax_percent = 18;
    const tax_multiplier = (tax_percent / 100).toFixed(2);
    const query = `
      SELECT
        utm_cust.unique_id AS cust_unique_id,
        c.company_id AS company_id,c.company_name AS company_name,c.address AS company_address,c.town AS company_town,c.country AS company_country,
        c.email AS company_email,c.mobile AS company_mobile,c.gstin AS company_gstin,c.state AS company_state,c.pincode AS company_pincode,
        u.user_id,
        u.first_name,
        u.last_name,
        u.email AS user_email,
        u.mobile AS user_mobile,
        p.property_id,
        p.prop_unique_id,
        p.property_name,
        p.city AS property_city,
        p.state AS property_state,
        p.country AS property_country,
        p.pincode AS property_pincode,
        pkg.package_name,
        sub.start_date AS subscription_start_date,
        sub.end_date AS subscription_end_date,
        sub.created_at AS subscription_creation_date,
        sub.subscription_id,
        sub.status AS status,
        sub.invoice,
        sub.invoice_date, 
        sub.invoice_from_address, 
        sub.invoice_to_address, 
        sub.invoice_to_name,
        sub.invoice_property_name, 
        sub.invoice_package_name, 
        sub.invoice_area,
        sub.invoice_no,
        sub.package_price,
        ROUND(sub.package_price * ${tax_multiplier}, 2) AS gst,
        ROUND(sub.package_price + (sub.package_price * ${tax_multiplier}), 2) AS total,
        (SELECT COUNT(*) FROM user) AS user_count,
        (SELECT COUNT(*) FROM property) AS property_count,
        (SELECT COUNT(*) FROM user_type_mapping AS utm
        INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id
        WHERE ut.user_type_category_id = 2) AS admin_count,
        (SELECT COUNT(*) FROM user_type_mapping AS utm
        INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id
        WHERE ut.user_type_category_id = 3) AS customer_count,
        (SELECT COUNT(*) FROM user_type_mapping AS utm
        INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id
        WHERE ut.user_type_category_id = 5) AS partner_builder_count,
        (SELECT COUNT(*) FROM user_type_mapping AS utm
        INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id
        WHERE ut.user_type_category_id = 6) AS channel_partner_count,
        (SELECT COUNT(*) FROM user_type_mapping AS utm
        INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id
        WHERE ut.user_type_category_id = 4) AS agent_count,
        (
            SELECT JSON_OBJECTAGG(pkg.package_name, IFNULL(sub_counts.count, 0))
            FROM package AS pkg
            LEFT JOIN (
                SELECT p.package_name, COUNT(*) AS count
                FROM subscription AS sub
                LEFT JOIN package p on p.package_id = sub.package_id
                GROUP BY p.package_name
            ) AS sub_counts ON pkg.package_name = sub_counts.package_name
            WHERE is_active = 1
        ) AS package_counts
      FROM
        property AS p
      LEFT JOIN
        subscription AS sub ON p.property_id = sub.property_id
      LEFT JOIN
        package AS pkg ON sub.package_id = pkg.package_id
      LEFT JOIN
        user AS u ON p.user_id = u.user_id
      LEFT JOIN
        user_type_mapping AS utm_cust ON p.user_id = utm_cust.user_id AND utm_cust.user_type_id = 3
      LEFT JOIN company AS c ON c.company_id = sub.company_id
      WHERE
        p.is_active = 1;
    `;

    let propertyDetails = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (!propertyDetails || propertyDetails.length === 0) {
      // return res.status(404).json({ error: 'No active properties found' });
      const count_query = `
        SELECT 
          (SELECT COUNT(*) FROM user) AS user_count,
          (SELECT COUNT(*) FROM property) AS property_count,
          (SELECT COUNT(*) FROM user_type_mapping AS utm INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id  WHERE ut.user_type_category_id < 3) AS admin_count,
          (SELECT COUNT(*) FROM user_type_mapping AS utm INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id  WHERE ut.user_type_category_id = 3) AS customer_count,
          (SELECT COUNT(*) FROM user_type_mapping AS utm INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id  WHERE ut.user_type_category_id = 5) AS partner_builder_count,
          (SELECT COUNT(*) FROM user_type_mapping AS utm INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id  WHERE ut.user_type_category_id = 6) AS channel_partner_count,
          (SELECT COUNT(*) FROM user_type_mapping AS utm INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id  WHERE ut.user_type_category_id = 4) AS agent_count
        FROM
          user_type_mapping
        WHERE
          user_type_id = 1
        `;

      propertyDetails = await db.sequelize.query(count_query, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      res.status(200).json({ properties: propertyDetails });
    }

    const propertiesWithFiles = await Promise.all(
      propertyDetails.map(async (propertyData) => {
        const invoices = await (propertyData.invoice &&
        propertyData.invoice.length
          ? JSON.parse(propertyData.invoice)
          : []);

        const invoiceUrls = await Promise.all(
          invoices.map(async (invoice) => {
            const invoiceUrl = await getFileUrl(invoice);
            return invoiceUrl;
          })
        );

        propertyData.invoices = invoices;
        propertyData.invoicesUrls = invoiceUrls;

        return propertyData;
      })
    );

    res.status(200).json({ properties: propertiesWithFiles });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to fetch property details' });
    res.status(500).json({ message: error.message });
  }
};

exports.editSubscription = async (req, res) => {
  const t = await db.sequelize.transaction({
    isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  });

  try {
    const { subscription_id } = req.params;
    const { status, otp, package_price, set_invoice_date } = req.body;
    const { user_id } = req.user;

    // Validate OTP
    const adminUser = await db.User.findByPk(user_id, { transaction: t });
    const email_otp = adminUser.email_otp;

    if (parseInt(otp) !== parseInt(email_otp)) {
      await t.rollback();
      return res.status(401).json({ error: "Incorrect OTP" });
    }

    // Find the subscription and related property
    const subscription = await db.Subscription.findByPk(subscription_id, {
      transaction: t,
    });
    if (!subscription) {
      await t.rollback();
      return res.status(404).json({ error: "Subscription not found" });
    }

    const property = await db.Property.findByPk(subscription.property_id, {
      include: [
        {
          model: db.User,
          attributes: ["email", "first_name", "last_name"],
        },
      ],
      transaction: t,
    });

    let start_date = subscription.start_date;
    let end_date = subscription.end_date;
    const custom_package_price = package_price || subscription.package_price;

    // Send email if status is Active
    if (status === "Active") {
      const customer = property.user;
      const customer_email = customer.email;
      const customer_name = `${customer.first_name} ${customer.last_name}`;
      const property_name = property.property_name;
      const email_message = `Hi ${customer_name},

      Your Invoice for property ${property_name} has been generated.
      Please login to view and download the invoice.

      Regards,
      Bhuvi Realtech`;

      await sendEmail(customer_email, email_message, "Invoice generated");
    }

    // Update dates and create tasks if necessary
    if (
      subscription.status === "Pending" &&
      status === "Active" &&
      property.is_verified
    ) {
      start_date = db.sequelize.literal("CURRENT_TIMESTAMP");
      end_date = db.sequelize.literal(
        "DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR)"
      );
      await createTasks(subscription_id, { transaction: t });
      await property.update({ assign_agent: 1 }, { transaction: t });
    }

    // Generate invoice number
    let invoice_unique_no = null;
    let formattedDate = null;

    if (status === "Active") {
      formattedDate = set_invoice_date
        ? db.sequelize.literal("CURDATE()")
        : null;
      const state_code = property.state_code;
      const city_code = property.city_code;

      // Call the generateInvoiceNumber function
      invoice_unique_no = await generateInvoiceNumber(
        user_id,
        state_code,
        city_code,
        "Invoice",
        t
      );
    }

    // Update the subscription
    const updated_subscription = await subscription.update(
      {
        package_price: custom_package_price,
        invoice_date: subscription.invoice_date || formattedDate,
        invoice_no: invoice_unique_no,
        start_date,
        end_date,
        status,
        last_update_by: user_id,
        updated_at: db.sequelize.literal("CURRENT_TIMESTAMP"),
      },
      { transaction: t }
    );

    // Commit the transaction
    await t.commit();

    res.status(201).json({
      message: "Subscription updated successfully",
      updated_subscription,
    });
  } catch (error) {
    // Rollback the transaction on error
    if (t) await t.rollback();
    console.error("Error updating subscription:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.addCommission = async (req, res) => {
  try {
    // const { commission_id } = req.params;
    const {
      otp,
      status,
      company_id,
      partner_builder_project_id,
      parent_id,
      commission_1,
      commission_2,
      commission_3,
      commission_4,
      commission_5,
      commission_6,
      commission_7,
      commission_8,
      commission_9,
      slab_1,
      slab_2,
      slab_3,
      slab_4,
      slab_5,
      slab_6,
      slab_7,
      slab_8,
      slab_9,
      start_date,
      end_date,
      payment,
    } = req.body;
    const { user_id } = req.user;

    const adminUser = await db.User.findByPk(user_id);
    const email_otp = adminUser.email_otp;

    if (parseInt(otp) !== parseInt(email_otp)) {
      return res.status(401).json({ error: "Incorrect OTP" });
    }

    // ✅ Validate partner_builder_project_id exists
    const project = await db.PartnerBuilderProject.findByPk(
      partner_builder_project_id
    );
    if (!project) {
      return res.status(400).json({
        error: "Invalid partner_builder_project_id. Project does not exist.",
      });
    }

    const commission = await db.Commission.create({
      company_id,
      partner_builder_project_id,
      parent_id: parent_id || null,
      commission_1,
      commission_2,
      commission_3,
      commission_4,
      commission_5,
      commission_6,
      commission_7,
      commission_8,
      commission_9,
      slab_1,
      slab_2,
      slab_3,
      slab_4,
      slab_5,
      slab_6,
      slab_7,
      slab_8,
      slab_9,
      status,
      payment_type: payment,
      created_by: user_id,
      last_update_by: user_id,
      start_date: start_date || null,
      end_date: end_date || null,
    });

    if (parent_id && start_date) {
      await db.Commission.update(
        {
          end_date: start_date,
        },
        {
          where: { commission_id: parent_id },
        }
      );
    }

    await db.PartnerBuilderProject.update(
      { payment },
      { where: { partner_builder_project_id } }
    );

    res.status(201).json({
      message: "Commission for Project added successfully!",
      commission,
    });
  } catch (error) {
    console.error("Error adding commission:", error);
    // res.status(500).json({ error: 'An error occurred while updating the subscription' });
    res.status(500).json({ message: error.message });
  }
};

exports.editCommission = async (req, res) => {
  try {
    const { commission_id } = req.params;
    const {
      otp,
      partner_builder_project_id,
      commission_1,
      commission_2,
      commission_3,
      commission_4,
      commission_5,
      commission_6,
      commission_7,
      commission_8,
      commission_9,
      slab_1,
      slab_2,
      slab_3,
      slab_4,
      slab_5,
      slab_6,
      slab_7,
      slab_8,
      slab_9,
      start_date,
      end_date,
      parent_id,
      payment,
    } = req.body;
    const { user_id } = req.user;

    const adminUser = await db.User.findByPk(user_id);
    const email_otp = adminUser.email_otp;

    if (parseInt(otp) !== parseInt(email_otp)) {
      return res.status(401).json({ error: "Incorrect OTP" });
    }

    const commission = await db.Commission.update(
      {
        commission_1,
        commission_2,
        commission_3,
        commission_4,
        commission_5,
        commission_6,
        commission_7,
        commission_8,
        commission_9,
        slab_1,
        slab_2,
        slab_3,
        slab_4,
        slab_5,
        slab_6,
        slab_7,
        slab_8,
        slab_9,
        payment_type: payment,
        last_update_by: user_id,
        start_date: start_date || null,
        end_date: end_date || null,
      },
      {
        where: { commission_id },
      }
    );

    if (parent_id && start_date) {
      await db.Commission.update(
        {
          end_date: start_date,
        },
        {
          where: { commission_id: parent_id },
        }
      );
    }

    await db.PartnerBuilderProject.update(
      { payment },
      { where: { partner_builder_project_id } }
    );

    res.status(201).json({
      message: "Commission for Project updated successfully!",
      commission,
    });
  } catch (error) {
    console.error("Error updating commission:", error);
    // res.status(500).json({ error: 'An error occurred while updating the subscription' });
    res.status(500).json({ message: error.message });
  }
};

exports.getCommission = async (req, res) => {
  try {
    const { partner_builder_project_id } = req.params;
    const commission = await db.Commission.findOne({
      where: {
        partner_builder_project_id,
        [Op.and]: [
          {
            [Op.or]: [
              {
                start_date: {
                  [Op.is]: null, // start_date is NULL
                },
              },
              {
                start_date: {
                  [Op.lte]: new Date(), // start_date >= current_date
                },
              },
            ],
          },
          {
            [Op.or]: [
              {
                end_date: {
                  [Op.is]: null, // end_date is NULL
                },
              },
              {
                end_date: {
                  [Op.gte]: new Date(), // end_date <= current_date
                },
              },
            ],
          },
        ],
      },
    });

    res.status(200).json({ commission });
  } catch (error) {
    console.error("Error fetching commission:", error);
    // res.status(500).json({ error: 'An error occurred while updating the subscription' });
    res.status(500).json({ message: error.message });
  }
};

exports.getCommissionForChild = async (req, res) => {
  try {
    const { commission_id } = req.params;
    const commission = await db.Commission.findOne({
      where: { parent_id: commission_id },
    });

    res.status(200).json({ commission });
  } catch (error) {
    console.error("Error fetching commission:", error);
    // res.status(500).json({ error: 'An error occurred while updating the subscription' });
    res.status(500).json({ message: error.message });
  }
};

exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await partnerBuilderService.getAllCompanies();

    res.status(200).json({ companies });
  } catch (error) {
    console.error("Error fetching companies: ", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllProjectsByCompanyId = async (req, res) => {
  try {
    const { company_id } = req.params;
    const projects = await partnerBuilderService.getAllProjectsByCompanyId(
      company_id
    );

    res.status(200).json({ projects });
  } catch (error) {
    console.error("Error fetching companies: ", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getChannelPartnerSales = async (req, res) => {
  try {
    // const channelPartnerSales = await db.ChannelPartnerSales.findAll({
    //   include: [{
    //     model: db.Property,
    //   }]
    // });

    // res.status(200).json({ channelPartnerSales });
    const query = `
        SELECT
            cust.first_name AS customer_first_name,
            cust.last_name AS customer_last_name,
            cust.user_id AS customer_id,
            cp.first_name AS added_by_first_name,
            cp.last_name AS added_by_last_name,
            prop.property_name,
            prop.area,
            prop.is_verified,
            subs.invoice_date,
            subs.start_date,
            subs.package_price,
            subs.tasks_created,
            subs.status AS subscription_status,
            cps.commission_percent,
            cps.commission,
            utm.unique_id
           
        FROM
            channel_partner_sales AS cps
        LEFT JOIN
            property AS prop ON cps.property_id = prop.property_id
        LEFT JOIN
            subscription AS subs ON cps.subscription_id = subs.subscription_id
        LEFT JOIN
            channel_partner AS chp ON cps.channel_partner_id = chp.channel_partner_id
        LEFT JOIN
            user AS cust ON prop.user_id = cust.user_id
        LEFT JOIN
            user AS cp ON cust.referred_by = cp.user_id
        LEFT JOIN 
        user_type_mapping AS utm ON cps.user_type_mapping_id = utm.user_type_mapping_id  
        
        ORDER BY
            subs.invoice_date;
        `;
    const channelPartnerSales = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    // return result;
    res.status(200).json({ channelPartnerSales });
  } catch (error) {
    console.error("Error fetching Channel Partner Sales: ", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getChannelPartnerTreeForAdmin = async (req, res) => {
  try {
    const { parent_channel_partner_id, channel_partner_id } = req.body;
    console.log("parent_channel_partner_id", parent_channel_partner_id);
    console.log("channel_partner_id", channel_partner_id);
    const dashboardData = await channelPartnerService.getChannelPartnerTreeData(
      parent_channel_partner_id,
      channel_partner_id
    );
    res.status(200).json({ dashboardData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllChannelPartnersForAdmin = async (req, res) => {
  try {
    //   const channelPartners = await db.ChannelPartner.findAll();
    const query = `
       SELECT 
            cp.channel_partner_id,
            cp.channel_partner_category_id,
            cp.user_type_mapping_id,
            cp.parent_channel_partner_id,
            cp.user_type_mapping_id,
            cp.user_id,
            cp.total_revenue,
            cp.total_cumulative_revenue,
            cp.total_referred,
            cp.total_commission,
            cp.total_cumulative_commission,
            cp.next_channel_partner_category_id,
            cp.effective_date,
            cpc.user_type_id,
            cpc.level,
            cpc.promotion_revenue,
            cpc.commission_percent,
            CONCAT(cust.first_name, ' ', cust.last_name) as cpname ,
            cust.email,
            utm.unique_id
        FROM 
            channel_partner as cp
        LEFT JOIN
            channel_partner_category cpc ON cp.channel_partner_category_id = cpc.channel_partner_category_id
        LEFT JOIN 
            user AS cust ON cp.user_id = cust.user_id
        JOIN 
        user_type_mapping AS utm ON cp.user_type_mapping_id = utm.user_type_mapping_id ;
        `;
    const channelPartners = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
    });
    res.status(200).json({ channelPartners });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllChannelPartnerCategories = async (req, res) => {
  try {
    const channelPartnerCategories = await db.ChannelPartnerCategory.findAll({
      include: [
        {
          model: db.UserType,
          attributes: ["user_type_id", "user_type_name"],
        },
      ],
    });
    res.status(200).json({ channelPartnerCategories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.promoteChannelPartner = async (req, res) => {
  try {
    const {
      channel_partner_id,
      next_channel_partner_category_id,
      effective_date,
      otp,
    } = req.body;
    const { user_id } = req.user;
    const promoted_by = user_id;

    const adminUser = await db.User.findByPk(user_id);
    const email_otp = adminUser.email_otp;

    if (parseInt(otp) !== parseInt(email_otp)) {
      return res.status(401).json({ error: "Incorrect OTP" });
    }

    const channelPartner = await channelPartnerService.promoteChannelPartner(
      channel_partner_id,
      next_channel_partner_category_id,
      effective_date,
      promoted_by
    );

    res.status(200).json({
      message: "Channel Partner promotion is set successfully!",
      channelPartner,
    });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to set Channel Partner Promotion' });
    res.status(500).json({ message: error.message });
  }
};

exports.generateInvoiceById = async (req, res) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    const { invoice_id } = req.body;
    const tax_percent = 18;
    const tax_multiplier = (tax_percent / 100).toFixed(2);
    const query = `
      SELECT
        utm_cust.unique_id AS cust_unique_id,
        c.company_id AS company_id,c.company_name AS company_name,c.address AS company_address,c.town AS company_town,c.country AS company_country,
        c.email AS company_email,c.mobile AS company_mobile,c.gstin AS company_gstin,c.state AS company_state,c.pincode AS company_pincode,
        u.user_id,
        u.first_name,
        u.last_name,
        u.email AS user_email,
        u.mobile AS user_mobile,
        p.property_id,
        p.prop_unique_id,
        p.property_name,
        p.city AS property_city,
        p.state AS property_state,
        p.country AS property_country,
        p.pincode AS property_pincode,
        pkg.package_name,
        sub.start_date AS subscription_start_date,
        sub.end_date AS subscription_end_date,
        sub.created_at AS subscription_creation_date,
        sub.subscription_id,
        sub.status AS status,
        sub.invoice,
        sub.invoice_date, 
        sub.invoice_from_address, 
        sub.invoice_to_address, 
        sub.invoice_to_name,
        sub.invoice_property_name, 
        sub.invoice_package_name, 
        sub.invoice_area,
        sub.invoice_no,
        sub.package_price,
        ROUND(sub.package_price * ${tax_multiplier}, 2) AS gst,
        ROUND(sub.package_price + (sub.package_price * ${tax_multiplier}), 2) AS total,
        (SELECT COUNT(*) FROM user) AS user_count,
        (SELECT COUNT(*) FROM property) AS property_count,
        (SELECT COUNT(*) FROM user_type_mapping AS utm
        INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id
        WHERE ut.user_type_category_id < 3) AS admin_count,
        (SELECT COUNT(*) FROM user_type_mapping AS utm
        INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id
        WHERE ut.user_type_category_id = 3) AS customer_count,
        (SELECT COUNT(*) FROM user_type_mapping AS utm
        INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id
        WHERE ut.user_type_category_id = 5) AS partner_builder_count,
        (SELECT COUNT(*) FROM user_type_mapping AS utm
        INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id
        WHERE ut.user_type_category_id = 6) AS channel_partner_count,
        (SELECT COUNT(*) FROM user_type_mapping AS utm
        INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id
        WHERE ut.user_type_category_id = 4) AS agent_count,
        (
            SELECT JSON_OBJECTAGG(pkg.package_name, IFNULL(sub_counts.count, 0))
            FROM package AS pkg
            LEFT JOIN (
                SELECT p.package_name, COUNT(*) AS count
                FROM subscription AS sub
                LEFT JOIN package p on p.package_id = sub.package_id
                GROUP BY p.package_name
            ) AS sub_counts ON pkg.package_name = sub_counts.package_name
            WHERE is_active = 1
        ) AS package_counts
      FROM
        property AS p
      LEFT JOIN
        subscription AS sub ON p.property_id = sub.property_id
      LEFT JOIN
        package AS pkg ON sub.package_id = pkg.package_id
      LEFT JOIN
        user AS u ON p.user_id = u.user_id
      LEFT JOIN
        user_type_mapping AS utm_cust ON p.user_id = utm_cust.user_id AND utm_cust.user_type_id = 3
      LEFT JOIN company AS c ON c.company_id = sub.company_id
      WHERE
        p.is_active = 1 AND sub.invoice_no=?;
    `;

    let propertyDetails = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
      replacements: [invoice_id],
    });

    if (!propertyDetails || propertyDetails.length === 0) {
      // return res.status(404).json({ error: 'No active properties found' });
      const count_query = `
        SELECT 
          (SELECT COUNT(*) FROM user) AS user_count,
          (SELECT COUNT(*) FROM property) AS property_count,
          (SELECT COUNT(*) FROM user_type_mapping AS utm INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id  WHERE ut.user_type_category_id < 3) AS admin_count,
          (SELECT COUNT(*) FROM user_type_mapping AS utm INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id  WHERE ut.user_type_category_id = 3) AS customer_count,
          (SELECT COUNT(*) FROM user_type_mapping AS utm INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id  WHERE ut.user_type_category_id = 5) AS partner_builder_count,
          (SELECT COUNT(*) FROM user_type_mapping AS utm INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id  WHERE ut.user_type_category_id = 6) AS channel_partner_count,
          (SELECT COUNT(*) FROM user_type_mapping AS utm INNER JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id  WHERE ut.user_type_category_id = 4) AS agent_count
        FROM
          user_type_mapping
        WHERE
          user_type_id = 1
        `;

      propertyDetails = await db.sequelize.query(count_query, {
        type: db.sequelize.QueryTypes.SELECT,
      });

      res.status(200).json({ properties: propertyDetails });
    }

    const propertiesWithFiles = await Promise.all(
      propertyDetails.map(async (propertyData) => {
        const invoices = await (propertyData.invoice &&
        propertyData.invoice.length
          ? JSON.parse(propertyData.invoice)
          : []);

        const invoiceUrls = await Promise.all(
          invoices.map(async (invoice) => {
            const invoiceUrl = await getFileUrl(invoice);
            return invoiceUrl;
          })
        );

        propertyData.invoices = invoices;
        propertyData.invoicesUrls = invoiceUrls;

        return propertyData;
      })
    );

    const property = propertiesWithFiles[0];

    const html = await ejs.renderFile(
      path.join(__dirname, "..", "Views", "invoice.ejs"),
      {
        property,
        logoUrl:
          "http://bhuvi.ai/lovable-uploads/b9093460-2664-41d9-836b-7e9366385fa7.png",
      }
    );

    const browser = await chromium.chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      scale: 1,
    });
    await browser.close();

    // Send the generated PDF file as a responsea
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Invoice_${property.invoice_no}.pdf"`,
    });
    // fs.writeFileSync("invoice_test.pdf", pdfBuffer);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      return res.status(500).json({ error: "PDF generation failed" });
    }

    return res.send(pdfBuffer);

    // res.status(200).json({ properties: propertiesWithFiles });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to fetch property details' });
    res.status(500).json({ message: error.message });
  }
};

exports.getAdminDashboardCount = async (req, res) => {
  try {
    const { user_id } = req.body;

    const CUSTOMER_DASHBOARD_QUERY = `SELECT 
	(SELECT COUNT(*)  FROM property WHERE is_active = 1) AS total_active_properties,
	(SELECT COUNT(*)  FROM property WHERE is_verified = 1) AS total_verified,
    (SELECT COUNT(*)  FROM property WHERE is_verified = 0) AS total_un_verified,
	(SELECT COUNT(*)  FROM package) AS total_package,
	(SELECT COUNT(*)  FROM property) AS total_properties,
	(SELECT COUNT(*) FROM user u 
	INNER JOIN user_type_mapping utm ON utm.user_id = u.user_id 
	WHERE utm.user_type_id = 4) AS total_agents,
    (SELECT COUNT(*) FROM user u 
	INNER JOIN user_type_mapping utm ON utm.user_id = u.user_id 
	WHERE utm.user_type_id = 14) AS total_franchise_partners,
        (SELECT COUNT(*) FROM user u 
	INNER JOIN user_type_mapping utm ON utm.user_id = u.user_id 
	WHERE utm.user_type_id = 15) AS total_surveyor_partners,
    (SELECT COUNT(*) FROM user u 
	INNER JOIN user_type_mapping utm ON utm.user_id = u.user_id 
	WHERE utm.user_type_id = 5) AS total_partner_builder,
	(SELECT COUNT(*)  FROM user u 
	INNER JOIN user_type_mapping utm ON utm.user_id = u.user_id 
	WHERE utm.user_type_id = 3) AS total_customers;`;

    const [rows] = await sequelize.query(CUSTOMER_DASHBOARD_QUERY, {
      replacements: [user_id, user_id, user_id],
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    const result = rows;

    return res
      .status(200)
      .json({ success: true, message: "Data Retrived successfully", result });
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

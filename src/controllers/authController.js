// src/controllers/authController.js
const authService = require("../services/authService");
const partnerBuilderService = require("../services/partnerBuilderService");
const db = require("../models");
// const sequelize = require("../models/index");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
// const Sequelize = require('../models/index')

dotenv.config();

const Sequelize = require("sequelize");
const dbConfig = require("../config/dbConfig");

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

async function adminLogin(req, res) {
  const { email, password } = req.body;

  try {
    const response = await authService.adminLogin(email, password);
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while logging in" });
  }
}

async function customerLogin(req, res) {
  const { email, password, user_type_category_id } = req.body;

  try {
    const response = await authService.customerLogin(
      email,
      password,
      user_type_category_id
    );
    res.json(response);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ message: 'An error occurred while logging in' });
    res.status(500).json({ message: error.message });
  }
}

async function customerSignup(req, res) {
  // const { email, password, user_type_id, first_name, last_name, mobile } = req.body;

  try {
    // const response = await authService.customerSignup(email, password);
    const response = await authService.customerSignup(req.body);
    res.json(response);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ message: 'An error occurred while signing up' });
    res.status(500).json({ message: error.message });
  }
}

async function verifyEmail(req, res) {
  const { email, otp } = req.body;

  try {
    const response = await authService.verifyEmail(email, otp);
    res.json(response);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ message: 'An error occurred while verifying email' });
    res.status(500).json({ message: error.message });
  }
}

async function verificationEmailToSuperadmins(req, res) {
  const { message } = req.body;
  const { user_id } = req.user;

  try {
    const response = await authService.sendVerificationEmailToSuperadmins(
      user_id,
      message
    );
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ message: 'An error occurred while verifying email' });
    res.status(500).json({ message: error.message });
  }
}

async function forgotPasswordOtp(req, res) {
  const { email } = req.body;

  try {
    const response = await authService.sendForgotPasswordOtp(email);
    res.json(response);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ message: 'An error occurred while verifying email' });
    res.status(500).json({ message: error.message });
  }
}

async function resetPassword(req, res) {
  const { email, password, otp } = req.body;

  try {
    const response = await authService.resetPassword(email, password, otp);
    res.json(response);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ message: 'An error occurred while verifying email' });
    res.status(500).json({ message: error.message });
  }
}

async function partnerBuilderSignup(req, res) {
  try {
    // const response = await authService.customerSignup(email, password);

    const { email, password, first_name, last_name, mobile, company_name } =
      req.body;

    const existingCompany = await db.Company.findOne({
      where: { company_name },
    });
    if (existingCompany) {
      return res.status(400).json({
        message:
          "company with same name already exist,Please enter a different name.",
      });
    }
    const partnerBuilderData = {
      email,
      password,
      user_type_id: 5,
      first_name,
      last_name,
      mobile,
    };

    //const { company_name } = req.body
    const response = await authService.customerSignup(partnerBuilderData);
    const { message, newUserTypeMapping } = response;
    const company = await partnerBuilderService.addCompany({ company_name });
    const { user_type_mapping_id, user_id } = newUserTypeMapping;
    await partnerBuilderService.addPartnerBuilder(
      user_id,
      user_type_mapping_id,
      company.company_id
    );
    res.json({ message });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ message: 'An error occurred while signing up' });
    res.status(500).json({ message: error.message });
  }
}

// ----------------------------------------------------- APIS CRETETED BY SHIVA ---------------------------------------------

async function login(req, res) {
  try {
    const { identifier, password } = req.body;
    console.log(req.body);
    if (!password || !identifier) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const email = isEmail && identifier;
    const mobile = !isEmail && identifier;

    const sql = `SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.mobile,
        u.email,
        u.password,
        utm.user_type_mapping_id,
        ut.user_type_id,
        utc.user_type_category_id AS role_id,
        utc.user_type_category_name AS role_name,
        CASE WHEN u.email_otp IS NULL THEN true ELSE false END AS email_verified,
        utm.is_admin,
        utm.is_superadmin
      FROM user u
      INNER JOIN user_type_mapping utm ON u.user_id = utm.user_id AND utm.is_active = 1
      INNER JOIN user_type ut ON utm.user_type_id = ut.user_type_id AND ut.is_active = 1
      INNER JOIN user_type_category utc ON ut.user_type_category_id = utc.user_type_category_id AND utc.is_active = 1
      WHERE (u.email = :email OR u.mobile = :mobile) AND utm.is_active = 1
      LIMIT 1`;
    const [results] = await sequelize.query(sql, {
      replacements: { email, mobile },
      raw: true,
    });

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const userData = results[0];
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token dynamically
    const token = jwt.sign(
      {
        user_id: userData.user_id,
        user_type_id: userData.user_type_id,
        user_type_mapping_id: userData.user_type_mapping_id,
        is_admin: userData.is_admin || 0,
        is_superadmin: userData.is_superadmin || 1,
        user_type_category_id: userData.role_id,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      },
      process.env.JWT_SECRET
    );

    return res.status(200).json({
      token,
      user_type_id: userData.user_type_id,
      user_type_mapping_id: userData.user_type_mapping_id,
      user_id: userData.user_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      mobile: userData.mobile,
      email: userData.email,
      email_verified: userData.email_verified,
      user_type_category_id: userData.role_id,
      role_id: userData.role_id,
      role_name: userData.role_name,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: error.message, success: false });
  }
}

async function createUser(req, res) {
  const {
    first_name,
    last_name,
    email,
    gender,
    status,
    mobile,
    user_type_id,
    password,
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const result = await sequelize.transaction(async (t) => {
      // Raw SQL query for inserting user data
      const insertUserQuery = `
        INSERT INTO user (username, first_name, last_name, email, mobile, password, created_at, updated_at, referred_by, email_otp)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL, NULL);
      `;
      const userResult = await sequelize.query(insertUserQuery, {
        replacements: [email, first_name, last_name, email, mobile, password],
        type: sequelize.QueryTypes.INSERT,
        transaction: t,
        raw: true,
      });

      const user_id = userResult[0]; // Get the inserted user_id

      // Insert into user_profile
      const insertProfileQuery = `
        INSERT INTO user_profile (user_id, first_name, last_name, email, mobile, current_address, current_town, 
          current_mandal, current_city, current_state, current_country, current_pincode, 
          permanent_address, permanent_town, permanent_mandal, permanent_city, permanent_state, 
          permanent_country, permanent_pincode, gender, gstin, image, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?, NULL, NULL, NOW(), NOW());
      `;
      await sequelize.query(insertProfileQuery, {
        replacements: [user_id, first_name, last_name, email, mobile, gender],
        type: sequelize.QueryTypes.INSERT,
        transaction: t,
        raw: true,
      });

      // Find user_type_id based on user_type_category_name
      const findUserTypeQuery = `
        SELECT user_type_id, user_type_category_name 
        FROM user_type 
        WHERE user_type_category_name = ? LIMIT 1;
      `;
      const userTypeResult = await sequelize.query(findUserTypeQuery, {
        replacements: [user_type_id],
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
        raw: true,
      });

      if (!userTypeResult.length) {
        throw new Error("Invalid user_type_id");
      }

      const user_type_id_value = userTypeResult[0].user_type_id;
      const category_name = userTypeResult[0].user_type_category_name;

      // Determine is_admin and is_superadmin
      const is_admin = category_name === "Admin" ? 1 : 0;
      const is_superadmin = category_name === "Super Admin" ? 1 : 0;

      // Insert into user_type_mapping
      const insertMappingQuery = `
        INSERT INTO user_type_mapping (user_id, user_type_id, is_active, status, is_admin, is_superadmin, unique_id)
        VALUES (?, ?, 1, ?, ?, ?, NULL);
      `;
      await sequelize.query(insertMappingQuery, {
        replacements: [
          user_id,
          user_type_id_value,
          status,
          is_admin,
          is_superadmin,
        ],
        type: sequelize.QueryTypes.INSERT,
        transaction: t,
        raw: true,
      });

      return {
        user_id,
        first_name,
        last_name,
        email,
        mobile,
        gender,
        status,
        user_type_id: category_name,
      };
    });
    return res.status(201).json({
      status: "success",
      data: result,
      message: "User created successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
}

module.exports = {
  adminLogin,
  customerLogin,
  customerSignup,
  verifyEmail,
  verificationEmailToSuperadmins,
  forgotPasswordOtp,
  resetPassword,
  partnerBuilderSignup,
  login,
  createUser,
};

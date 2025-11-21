// src/services/authService.js
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwtUtils = require("../utils/jwtUtils");
const db = require("../models");
const emailService = require("../services/emailService");
const channelPartnerService = require("../services/channelPartnerService");
const { Op } = require("sequelize");
const STATIC_OTP = process.env.STATIC_OTP;
console.log("STATIC_OTP from .env ===", STATIC_OTP);

// const { use } = require('bcrypt/promises');
// const { stat } = require('fs-extra');

async function customerSignup(customer) {
  const {
    email,
    password,
    user_type_id,
    first_name,
    last_name,
    mobile,
    referral_code,
    dob,
  } = customer;
  console.log("customer", customer);

  return await db.sequelize.transaction(async (t) => {
    // Check if the email already exists
    const existingUser = await db.User.findOne({
      where: { email },
      transaction: t,
    });
    let user_id, status;

    if (existingUser) {
      user_id = existingUser.user_id;
      status = "Active";
      const duplicate = await db.UserTypeMapping.findOne({
        where: {
          user_id,
          [Op.or]: [
            {
              user_type_id,
            },
            {
              status: {
                [Op.ne]: "Active",
              },
            },
          ],
          user_type_id,
        },
        transaction: t,
      });

      if (duplicate) {
        console.error(duplicate);
        throw new Error("Email already exists or not verified.");
      }
    } else {
      //const otp = generateOTP();
      const otp = generateOTP(); // ✅ This uses your STATIC_OTP properly
      console.log("Generated OTP (to be saved in DB) ===", otp);
      const hashedPassword = await bcrypt.hash(password, 10);
      status = "Pending";

      const newUser = await db.User.create(
        {
          first_name,
          last_name,
          username: email,
          email,
          password: hashedPassword,
          mobile,
          email_otp: otp,
          dob,
        },
        { transaction: t }
      );

      user_id = newUser.user_id;

      //const email_body = `Your verification OTP is: ${otp}`;//Modified on 30-05-2024
      const email_body = `Please remember that your One-Time Password (OTP) is confidential and should never be shared with anyone.\n\nYour OTP for email verification is: ${otp}\n\nRegards,\nBhuvi RealTech`;
      await emailService.sendVerificationEmail(email, email_body);
    }
    // const queryforcount = `SELECT count(user_id) as count FROM user_type_mapping where user_type_id =  ${user_type_id}  `;
    // let countData = await db.sequelize.query(queryforcount, {
    //   type: db.sequelize.QueryTypes.SELECT,
    // });

    const userType = await db.UserType.findByPk(user_type_id);
    const user_type_category_id = userType.user_type_category_id;

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
    //const unique_id = "CU" + idString;
    let unique_id = null;
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
    } else if (user_type_category_id === 7) {
      unique_id = "FR" + idString;
    } else if (user_type_category_id === 8) {
      unique_id = "SU" + idString;
    }
    console.log("uniqueId===", unique_id);
    const newUserTypeMapping = await db.UserTypeMapping.create(
      {
        user_type_id,
        user_id: user_id,
        unique_id,
        status,
      },
      { transaction: t }
    );

    const userProfileData = {
      user_id,
      first_name,
      last_name,
      email,
      mobile,
      current_city: customer.city || null,
      current_state: customer.state || null,
      gender: customer.gender || null,
    };

    if (referral_code) {
      const userTypeMappingId = newUserTypeMapping.user_type_mapping_id;
      await channelPartnerService.addChannelPartnerByReferenceCode(
        userTypeMappingId,
        referral_code,
        t
      );
    }

    await db.UserProfile.create(userProfileData, { transaction: t });

    return {
      message: "Signup successful. Please verify your email.",
      newUserTypeMapping,
    };
  });
}

async function verifyEmail(email, otp) {
  const user = await db.User.findOne({ where: { email } });

  if (!user) {
    throw new Error("Invalid email");
  }

  const userTypeMapping = await db.UserTypeMapping.findOne({
    where: { user_id: user.user_id },
  });

  if (!userTypeMapping) {
    throw new Error("User Type Mapping not found");
  }

  if (userTypeMapping.status === "Active") {
    throw new Error("Email already verified");
  }

  if (parseInt(user.email_otp) !== parseInt(otp)) {
    throw new Error("Invalid OTP");
  }

  userTypeMapping.status = "Active";
  await userTypeMapping.save();

  return { message: "Email verified successfully" };
}

function generateOTP() {
  const otpLength = 6;
  const otpDigits = "0123456789";
  let otp = "";

  for (let i = 0; i < otpLength; i++) {
    const randomIndex = Math.floor(Math.random() * otpDigits.length);
    otp += otpDigits.charAt(randomIndex);
  }

  return otp;
}

// function generateOTP() {
//   return '123456'; // Static OTP for testing
// }
// function generateOTP() {
//   if (STATIC_OTP && process.env.NODE_ENV !== 'production') {
//     return STATIC_OTP;
//   }

//   const otpLength = 6;
//   const otpDigits = '0123456789';
//   let otp = '';

//   for (let i = 0; i < otpLength; i++) {
//     const randomIndex = Math.floor(Math.random() * otpDigits.length);
//     otp += otpDigits.charAt(randomIndex);
//   }

//   return otp;
// }

async function adminLogin(email, password) {
  try {
    // Verify email and password
    //const user = await db.User.findOne({ where: { email, is_active: 1, status: 'Active' } });
    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Check if the user is an admin or superadmin
    if (!(user.is_admin || user.is_superadmin)) {
      throw new Error("Unauthorized access");
    }

    // Generate JWT token
    // const token = jwt.sign({ user_id: user._id }, 'your-secret-key', { expiresIn: '1h' });
    const token = jwtUtils.generateToken({
      user_id: user.user_id,
      is_admin: user.is_admin,
      is_superadmin: user.is_superadmin,
    });

    return token;
  } catch (error) {
    throw error;
  }
}

async function customerLogin(email, password, user_type_category_id) {
  try {
    // Verify email and password
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const userTypeMapping = await db.UserTypeMapping.findOne({
      where: { user_id: user.user_id, is_active: 1 },
      include: [
        {
          model: db.UserType,
          where: {
            user_type_category_id: user_type_category_id,
          },
        },
      ],
    });

    if (userTypeMapping.status !== "Active") {
      return {
        email: user.email,
        email_verified: false,
      };
    }

    // Generate JWT token
    // const token = jwt.sign({ user_id: user._id }, 'your-secret-key', { expiresIn: '1h' });
    const token = jwtUtils.generateToken({
      user_id: user.user_id,
      user_type_id: userTypeMapping.user_type_id,
      user_type_mapping_id: userTypeMapping.user_type_mapping_id,
      is_admin: userTypeMapping.is_admin,
      is_superadmin: userTypeMapping.is_superadmin,
      user_type_category_id,
    });

    return {
      token,
      user_type_id: userTypeMapping.user_type_id,
      user_type_mapping_id: userTypeMapping.user_type_mapping_id,
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      mobile: user.mobile,
      email: user.email,
      email_verified: true,
      user_type_category_id,
    };
  } catch (error) {
    throw error;
  }
}

// async function sendEmailToSuperadmins(message, subject) {
//   try {
//     // Verify email and password
//     const superadmins = await db.User.findAll({ where: { is_superadmin: 1, is_active: 1, status: 'Active' } });
//     if (!superadmins) {
//       throw new Error('Please add a Super Admin first. Contact the developers to add a Super Admin');
//     }

//     // const otp = generateOTP();
//     // const email_body = message + '\nOTP for verification is ' + otp;

//     for (const superadmin of superadmins) {
//       emailService.sendEmail(superadmin.email, message, subject);
//       // superadmin.email_otp = otp;
//       // await superadmin.save();
//     }

//     return 'OTP for verification has been successfully sent to the Super Admin.';
//   } catch (error) {
//     throw error;
//   }
// }
async function sendEmailToSuperadmins(message, subject) {
  try {
    // SQL query to find superadmins
    const superadmins = await db.sequelize.query(
      `
          SELECT u.email
          FROM user u
          INNER JOIN user_type_mapping utm ON u.user_id = utm.user_id
          WHERE utm.is_superadmin = 1 AND utm.is_active = 1 AND utm.status = 'Active';
        `,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!superadmins || superadmins.length === 0) {
      throw new Error(
        "Please add a Super Admin first. Contact the developers to add a Super Admin"
      );
    }

    // const otp = generateOTP();
    // const email_body = message + '\nOTP for verification is ' + otp;

    for (const superadmin of superadmins) {
      emailService.sendEmail(superadmin.email, message, subject);
      // superadmin.email_otp = otp;
      // await superadmin.save();
    }

    return "OTP for verification has been successfully sent to the Super Admins.";
  } catch (error) {
    throw error;
  }
}

// async function sendVerificationEmailToSuperadmins(message) {
//   try {
//     // Verify email and password
//     const superadmins = await db.User.findAll({ where: { is_superadmin: 1, is_active: 1, status: 'Active' } });
//     if (!superadmins) {
//       throw new Error('Please add a Super Admin first. Contact the developers to add a Super Admin');
//     }

//     const otp = generateOTP();
//     const email_body = message + '\nOTP for verification is ' + otp;

//     for (const superadmin of superadmins) {
//       emailService.sendVerificationEmail(superadmin.email, email_body);
//       superadmin.email_otp = otp;
//       await superadmin.save();
//     }

//     return 'OTP for verification has been successfully sent to the Super Admin.';
//   } catch (error) {
//     throw error;
//   }
// }
async function sendVerificationEmailToSuperadmins(user_id, message) {
  try {
    // SQL query to find superadmins
    const superadmins = await db.sequelize.query(
      `
          SELECT u.email
          FROM user u
          INNER JOIN user_type_mapping utm ON u.user_id = utm.user_id
          WHERE utm.is_superadmin = 1 AND utm.is_active = 1 AND utm.status = 'Active';
        `,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!superadmins || superadmins.length === 0) {
      throw new Error(
        "Please add a Super Admin first. Contact the developers to add a Super Admin"
      );
    }

    const otp = generateOTP();

    // // Extract superadmin email addresses into an array
    // const superadminEmails = superadmins.map(superadmin => superadmin.email);

    // Update all superadmins in one query
    await db.User.update(
      { email_otp: otp },
      {
        where: {
          // email: superadminEmails,
          user_id,
        },
      }
    );

    // Send verification emails to superadmins
    for (const superadmin of superadmins) {
      const email_body = message + "\nOTP for verification is " + otp;
      // emailService.sendVerificationEmail(superadmin.email, email_body);
    }

    return "OTP for verification has been successfully sent to the Super Admins.";
  } catch (error) {
    throw error;
  }
}

async function sendForgotPasswordOtp(email) {
  try {
    const otp = generateOTP();
    const message = `Your reset password OTP is: ${otp}`;
    const subject = "Reset Password";

    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      throw new Error("User does not exist.");
    }
    await user.update({ email_otp: otp });

    emailService.sendEmail(email, message, subject);

    return "OTP for reset password has been successfully sent to the User";
  } catch (error) {
    console.error("Error in sendForgotPasswordOtp:", error.message);
    throw new Error("Failed to send OTP. Please try again later.");
  }
}

async function resetPassword(email, password, otp) {
  try {
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      throw new Error("User does not exist.");
    }

    if (user.email_otp !== otp) {
      throw new Error("Invalid OTP");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await user.update({ password: hashedPassword });

    return "Password reset successfully!";
  } catch (error) {
    console.error("Error in resetPassword:", error.message);
    throw new Error("Failed to reset password. Please try again.");
  }
}

module.exports = {
  customerSignup,
  verifyEmail,
  customerLogin,
  adminLogin,
  sendEmailToSuperadmins,
  sendVerificationEmailToSuperadmins,
  sendForgotPasswordOtp,
  resetPassword,
};

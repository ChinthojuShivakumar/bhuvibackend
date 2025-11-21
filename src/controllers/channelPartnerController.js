// src/controllers/channelPartnerController.js
const db = require("../models");
const channelPartnerService = require("../services/channelPartnerService");
const bcrypt = require("bcrypt");

exports.addUser = async (req, res) => {
  try {
    const { user_id: channelPartnerUserId, user_type_mapping_id } = req.user;

    // Extract the required data from the request body
    const { email, password, first_name, last_name, mobile, status } = req.body;

    const is_admin = 0;
    const is_superadmin = 0;
    const user_type_id = 3;

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
        throw new Error("This User already exists.");
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
        referred_by: channelPartnerUserId,
      });

      user_id = newUser.user_id;
    }

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
    // const queryforcount = `SELECT count(user_id) as count FROM user_type_mapping where user_type_id =  ${user_type_id} `;
    // let countData = await db.sequelize.query(queryforcount, {
    //   type: db.sequelize.QueryTypes.SELECT,
    // });
    const uniqueIdCount = countData[0].count;
    const getCount = uniqueIdCount + 1;
    const idString = getCount.toString().padStart(7, "0");
    const unique_id = "CU" + idString;

    console.log("unique_id===", unique_id);
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

    const channelPartner = await db.ChannelPartner.findOne({
      where: { user_type_mapping_id },
    });
    const total_referred = channelPartner.total_referred;
    channelPartner.total_referred = total_referred ? total_referred + 1 : 1;

    await channelPartner.save();

    res.status(201).json({ message: "User added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.addChannelPartner = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { user_id: channelPartnerUserId, user_type_mapping_id } = req.user;
    const { email, password, first_name, last_name, mobile, status } = req.body;

    const is_admin = 0;
    const is_superadmin = 0;
    const user_type_id = 7;

    const existingUser = await db.User.findOne({
      where: { email },
      transaction,
    });
    let user_id;

    if (existingUser) {
      user_id = existingUser.user_id;
      const duplicate = await db.UserTypeMapping.findOne({
        where: { user_id, user_type_id },
        transaction,
      });

      if (duplicate) {
        throw new Error("This User already exists.");
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await db.User.create(
        {
          first_name,
          last_name,
          username: email,
          email,
          password: hashedPassword,
          mobile,
          referred_by: channelPartnerUserId,
        },
        { transaction }
      );

      user_id = newUser.user_id;
    }
    // const queryforcount = `SELECT count(user_id) as count FROM user_type_mapping where user_type_id =  ${user_type_id} `;
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
    const unique_id = "CP" + idString;

    const newUserTypeMapping = await db.UserTypeMapping.create(
      {
        user_id,
        user_type_id,
        is_active: 1,
        status,
        unique_id,
        is_admin,
        is_superadmin,
      },
      { transaction }
    );

    if (req.body.gender || req.body.city || req.body.state) {
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
      await db.UserProfile.create(userProfileData, { transaction });
    }

    const channelPartner = await db.ChannelPartner.findOne({
      where: { user_type_mapping_id },
      transaction,
    });
    channelPartner.total_referred = (channelPartner.total_referred || 0) + 1;

    await channelPartner.save({ transaction });

    await channelPartnerService.addChannelPartner(
      1,
      newUserTypeMapping.user_type_mapping_id,
      channelPartner.channel_partner_id,
      transaction
    );

    await transaction.commit();

    res.status(201).json({ message: "Channel Partner added successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboardNumbers = async (req, res) => {
  try {
    const { user_type_mapping_id } = req.user;
    const channelPartner = await db.ChannelPartner.findOne({
      include: [
        {
          model: db.ChannelPartnerCategory,
          attributes: [
            "level",
            "promotion_revenue",
            "commission_percent",
            "next_commission_percent",
            "channel_partner_category_id",
          ],
          as: "channelPartnerCategory",
        },
      ],
      where: { user_type_mapping_id },
    });

    res.status(200).json({ channelPartner });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    const { user_type_mapping_id } = req.user;
    const channelPartner = await db.ChannelPartner.findOne({
      where: { user_type_mapping_id },
    });
    const channel_partner_id = channelPartner.channel_partner_id;

    const dashboardData = await channelPartnerService.getDashboardData(
      channel_partner_id
    );

    res.status(200).json({ dashboardData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getChannelPartnerTree = async (req, res) => {
  try {
    console.log("Body===", req.params);
    const { channel_partner_id: cp_id } = req.params;
    const { user_type_mapping_id } = req.user;
    const channelPartner = await db.ChannelPartner.findOne({
      where: { user_type_mapping_id },
    });
    const parent_channel_partner_id = channelPartner.channel_partner_id;
    const channel_partner_id = cp_id || parent_channel_partner_id;

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

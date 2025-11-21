// src/sevices/taskService.js
const db = require("../models");
const partnerBuilderService = require("../services/partnerBuilderService");
const channelPartnerService = require("../services/channelPartnerService");
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

const monthly = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const quarterly = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];
const half_yearly = ["Jan - Jun", "Jul - Dec"];

exports.createTasks = async (subscription_id, options = {}) => {
  const { transaction } = options;

  try {
    const subscription = await db.Subscription.findByPk(subscription_id, {
      include: [
        {
          model: db.Property,
          attributes: ["partner_builder_project_id", "area"],
        },
        {
          model: db.User,
          attributes: ["referred_by"],
        },
      ],
      transaction, // Use transaction if provided
    });

    const { property_id, package_id, user_id, tasks_created } = subscription;

    if (tasks_created) {
      throw new Error(
        `Tasks already created for subscription_id :: ${subscription_id}`
      );
    }

    const packageServices = await db.PackageService.findAll({
      where: {
        is_active: 1,
        package_id: subscription.package_id,
      },
      include: [
        {
          model: db.Service,
          attributes: ["service_id", "service_name"],
          as: "Service",
          where: { is_active: 1 },
        },
      ],
      transaction, // Use transaction if provided
    });

    const tasks = packageServices.map((packageService) => {
      const { service_id, service_name } = packageService.Service;

      return {
        subscription_id,
        property_id,
        user_id,
        package_id,
        service_id,
        service_name,
      };
    });

    await db.Task.bulkCreate(tasks, { transaction }); // Use transaction if provided

    const { partner_builder_project_id, area } = subscription.property;
    const { referred_by: channel_partner_user_id } = subscription.user;

    let commission = null;
    if (partner_builder_project_id) {
      commission = await partnerBuilderService.getCommissionByArea(
        partner_builder_project_id,
        area,
        { transaction }
      );
    }
    if (channel_partner_user_id) {
      await channelPartnerService.addCommissionWrapper(subscription, {
        transaction,
      });
    }

    await subscription.update(
      { tasks_created: 1, commission },
      { transaction }
    );
    console.log(
      `Tasks created successfully for subscription_id = ${subscription_id}`
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};

exports.addTasks = async (req, res) => {
  const { subscription_id } = req.body;

  try {
    await sequelize.transaction(async (transaction) => {
      const subscription = await db.Subscription.findByPk(subscription_id, {
        include: [
          {
            model: db.Property,
            attributes: ["partner_builder_project_id", "area"],
          },
          {
            model: db.User,
            attributes: ["referred_by"],
          },
        ],
        transaction,
      });

      const { property_id, package_id, user_id, tasks_created } = subscription;

      if (tasks_created) {
        throw new Error(
          `Tasks already created for subscription_id :: ${subscription_id}`
        );
      }

      const packageServices = await db.PackageService.findAll({
        where: {
          is_active: 1,
          package_id: subscription.package_id,
        },
        include: [
          {
            model: db.Service,
            attributes: ["service_id", "service_name"],
            as: "Service",
            where: { is_active: 1 },
          },
        ],
        transaction,
      });

      const tasks = packageServices.map((packageService) => {
        const { service_id, service_name } = packageService.Service;

        return {
          subscription_id,
          property_id,
          user_id,
          package_id,
          service_id,
          service_name,
        };
      });

      await db.Task.bulkCreate(tasks, { transaction });

      const { partner_builder_project_id, area } = subscription.property;
      const { referred_by: channel_partner_user_id } = subscription.user;

      let commission = null;
      if (partner_builder_project_id) {
        commission = await partnerBuilderService.getCommissionByArea(
          partner_builder_project_id,
          area,
          { transaction }
        );
      }

      if (channel_partner_user_id) {
        await channelPartnerService.addCommissionWrapper(subscription, {
          transaction,
        });
      }

      await subscription.update(
        { tasks_created: 1, commission },
        { transaction }
      );

      console.log(
        `Tasks created successfully for subscription_id = ${subscription_id}`
      );
    });

    return res.status(200).json({
      message: "Tasks created successfully",
      success: true,
    });
  } catch (error) {
    // console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Function to validate a date string
exports.isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/; // ISO 8601 date format
  return regex.test(dateString) && !isNaN(Date.parse(dateString));
};

// Function to validate status
exports.isValidStatus = (status) => {
  const validStatuses = ["Pending", "Ongoing", "Completed"];
  return typeof status === "string" && validStatuses.includes(status);
};

exports.getSubscriptionIdByProperty = async (req, res) => {
  try {
    const property_id = req.query?.property_id || null;

    const result = await sequelize.transaction(async (t) => {
      let query = `
      SELECT s.subscription_id, u.user_id, u.first_name, u.last_name FROM subscription s 
      LEFT JOIN user u ON u.user_id = s.user_id
      `;

      // Add company_id filter if provided
      if (property_id) {
        query += ` WHERE property_id  = '${property_id}';`;
      }

      const subscription = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
        raw: true,
      });

      return subscription;
    });

    return res.status(200).json({
      message: "Subscription Id Fetched Successfully",
      success: true,
      subscriptionId: result[0],
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error.message, message: "Internal Server Error" });
  }
};

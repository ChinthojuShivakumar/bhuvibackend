const dotenv = require("dotenv");
dotenv.config();

const axios = require("axios");
const https = require("https");
const Sequelize = require("sequelize");
const dbConfig = require("../config/dbConfig");
const { sendEmail } = require("../services/emailService");

// Environment setup
const env = process.env.NODE_ENV || "development";
const config = dbConfig[env];

// Razorpay credentials
const key_id = process.env.TEST_RAZORPAY_KEY_ID;
const key_secret = process.env.TEST_RAZORPAY_SECRET;
const base64 = Buffer.from(`${key_id}:${key_secret}`).toString("base64");

// Sequelize instance
const sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: config.dialect,
  define: {
    timestamps: false,
    freezeTableName: true,
  },
  logging: false,
});

// HTTPS agent (only for development)
const agent =
  env === "development"
    ? new https.Agent({ rejectUnauthorized: false })
    : undefined;

exports.addOrder = async (req, res) => {
  const {
    original_amount,
    package_id,
    service_id,
    subscription_id,
    user_id,
    order_gst,
    discount_amount,
    total_amount,
  } = req.body;

  // ✅ Validate required fields
  const requiredFields = [
    "original_amount",
    "package_id",
    "subscription_id",
    "user_id",
    "order_gst",
    "total_amount",
  ];

  const missingFields = requiredFields.filter((field) => !req.body[field]);
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
      missingFields,
    });
  }

  // ✅ Prepare Razorpay order options
  const options = {
    amount: total_amount * 100, // Razorpay expects amount in paise
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  try {
    // ✅ Create order in Razorpay
    const response = await axios.post(
      "https://api.razorpay.com/v1/orders",
      options,
      {
        headers: {
          Authorization: `Basic ${base64}`,
          "Content-Type": "application/json",
        },
        httpsAgent: agent,
      }
    );
    console.log(response.data);

    const { status, id } = response.data;

    const discountAmount = discount_amount || 0;

    // ✅ Insert into DB
    if (response.status === 200 || response.status === 201) {
      await sequelize.query(
        `INSERT INTO payment (
          razorpay_order_id, order_amount, order_status, discount_amount,
          user_id, subscription_id, package_id, order_gst
        ) VALUES (?,?,?,?,?,?,?,?)`,
        {
          replacements: [
            id,
            total_amount,
            status,
            discountAmount,
            user_id,
            subscription_id,
            package_id,
            order_gst,
          ],
        }
      );
    }

    // ✅ Send success response
    res.status(200).json({
      success: true,
      order: response.data,
    });
  } catch (error) {
    console.error(
      "Error creating order:",
      error.response?.data || error.message
    );

    res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.error?.description || "Order creation failed",
      error: error.response?.data || error.message,
    });
  }
};

// Verify Razorpay order
exports.verifyOrder = async (req, res) => {
  const { order_id, razorpay_signature, razorpay_payment_id, subscription_id } =
    req.body;

  try {
    const response = await axios.get(
      `https://api.razorpay.com/v1/orders/${order_id}`,
      {
        headers: {
          Authorization: `Basic ${base64}`,
          "Content-Type": "application/json",
        },
        httpsAgent: agent,
      }
    );

    // console.log("Order verified:", response.data);
    if (response.status === 200 || response.status === 201) {
      await sequelize.query(
        `UPDATE payment
        SET order_status = ?,
        razorpay_signature=?,
        razorpay_payment_id=?
        WHERE razorpay_order_id = ?`,
        {
          replacements: [
            response.data.status,
            razorpay_signature,
            razorpay_payment_id,
            order_id,
          ],
        }
      );

      const startDate = new Date(Date.now());
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      await sequelize.query(
        `UPDATE subscription SET status = 'Active',
        start_date = ?,
        end_date = ? 
        WHERE subscription_id = ? AND start_date IS NULL AND end_date IS NULL`,
        {
          replacements: [formattedStartDate, formattedEndDate, subscription_id],
        }
      );
    }

    const data = {
      order_id: order_id,
      status: response.data.status,
    };

    res.status(200).json({
      success: true,
      order: data,
      message: "Verified order successfully",
    });
  } catch (error) {
    console.error(
      "Error verifying order:",
      error.response?.data || error.message
    );

    res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.error?.description || "Order verification failed",
      error: error.response?.data || error.message,
    });
  }
};

exports.createRefund = async (req, res) => {
  const { payment_id, amount } = req.body;

  try {
    const response = await axios.post(
      `https://api.razorpay.com/v1/payments/${payment_id}/refund`,
      { amount: amount },
      {
        headers: {
          Authorization: `Basic ${base64}`,
          "Content-Type": "application/json",
        },
        httpsAgent: agent,
      }
    );

    console.log("Order verified:", response.data);
    if (response.status === 200 || response.status === 201) {
      await sequelize.query(
        `UPDATE payment
        SET refund_status = ?,
        refund_id=?
        WHERE razorpay_payment_id = ?`,
        {
          replacements: [response.data.status, response.data.id, payment_id],
        }
      );

      // const startDate = new Date(Date.now());
      // const endDate = new Date(startDate);
      // endDate.setFullYear(endDate.getFullYear() + 1);

      // const formattedStartDate = startDate.toISOString().split("T")[0];
      // const formattedEndDate = endDate.toISOString().split("T")[0];

      // await sequelize.query(
      //   `UPDATE subscription SET status = 'Active',
      //   start_date = ?,
      //   end_date = ?
      //   WHERE subscription_id = ?`,
      //   {
      //     replacements: [formattedStartDate, formattedEndDate, subscription_id],
      //   }
      // );
    }

    const data = {
      payment_id: payment_id,
      status: response.data.status,
    };

    return res.status(200).json({
      success: true,
      order: data,
      message: "refund initiated successfully",
    });
  } catch (error) {
    console.error(
      "Error verifying order:",
      error.response?.data || error.message
    );

    return res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.error?.description || "Order verification failed",
      error: error.response?.data || error.message,
    });
  }
};

exports.verifyRefund = async (req, res) => {
  const { payment_id, refund_id, order_id } = req.body;

  try {
    const response = await axios.get(
      `https://api.razorpay.com/v1/payments/${payment_id}/refunds/${refund_id}`,
      {
        headers: {
          Authorization: `Basic ${base64}`,
          "Content-Type": "application/json",
        },
        httpsAgent: agent,
      }
    );

    console.log("Order verified:", response.data);
    if (response.status === 200 || response.status === 201) {
      await sequelize.query(
        `UPDATE payment
        SET refund_status = ?,
        refund_id=?
        WHERE razorpay_order_id = ?`,
        {
          replacements: [response.data.status, refund_id, order_id],
        }
      );

      // const startDate = new Date(Date.now());
      // const endDate = new Date(startDate);
      // endDate.setFullYear(endDate.getFullYear() + 1);

      // const formattedStartDate = startDate.toISOString().split("T")[0];
      // const formattedEndDate = endDate.toISOString().split("T")[0];

      // await sequelize.query(
      //   `UPDATE subscription SET status = 'Active',
      //   start_date = ?,
      //   end_date = ?
      //   WHERE subscription_id = ?`,
      //   {
      //     replacements: [formattedStartDate, formattedEndDate, subscription_id],
      //   }
      // );
    }

    // const data = {
    //   order_id: order_id,
    //   status: response.data.status,
    // };

    return res.status(200).json({
      success: true,
      order: response.data,
      message: "Verified refund successfully",
    });
  } catch (error) {
    console.error(
      "Error verifying order:",
      error.response?.data || error.message
    );

    return res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.error?.description || "Order verification failed",
      error: error.response?.data || error.message,
    });
  }
};

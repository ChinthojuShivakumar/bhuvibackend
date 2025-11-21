const dotenv = require("dotenv");
const Sequelize = require("sequelize");
const dbConfig = require("../config/dbConfig");
const { sendEmail } = require("../services/emailService");
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

// exports.createChat = async (req, res) => {
//   try {
//     const {
//       sender_id,
//       receiver_id,
//       message,
//       images,
//       documents,
//       property_id,
//       service_id,
//       task_id,
//       user_id,
//       sender_read_status,
//     } = req.body;
//     console.log("Incoming body:", req.body);
//     const parsedData = {
//       sender_id: parseInt(sender_id, null),
//       receiver_id: parseInt(receiver_id, null),
//       user_id: parseInt(user_id, null),
//       property_id: parseInt(property_id, null),
//       service_id: parseInt(service_id, null),
//       task_id: parseInt(task_id, null),
//       message: message || null,

//       sender_read_status: sender_read_status || "sent",
//     };

//     console.log(parsedData);

//     const result = await sequelize.transaction(async (t) => {
//       const query = `
//     INSERT INTO chat (
//       user_id,
//       sender_id,
//       receiver_id,
//       message,
//       images,
//       documents,
//       property_id,
//       service_id,
//       task_id,
//       sender_read_status
//     ) VALUES (
//       ?, ?, ?, ?, ?, ?, ?, ?, ?,?
//     );
//   `;

//       const parsedImage = JSON.stringify(images);
//       const parsedDocument = JSON.stringify(documents);

//       const values = [
//         parsedData.user_id,
//         parsedData.sender_id,
//         parsedData.receiver_id,
//         parsedData.message,
//         parsedImage, // string or JSON stringified
//         parsedDocument, // string or JSON stringified
//         parsedData.property_id,
//         parsedData.service_id,
//         parsedData.task_id,
//         parsedData.sender_read_status,
//       ];

//       const [insertedData] = await sequelize.query(query, {
//         replacements: values,
//         transaction: t,
//         type: Sequelize.QueryTypes.INSERT,
//       });

//       return insertedData[0];
//     });
//     return res.status(201).json({
//       success: true,
//       message: "chat inserted successfully",
//       data: result,
//     });
//   } catch (error) {
//     console.log(error);

//     return res.status(500).json(error);
//   }
// };

exports.createChat = async (req, res) => {
  try {
    const {
      sender_id,
      receiver_id,
      message,
      property_id,
      service_id,
      task_id,
      user_id,
      sender_read_status,
    } = req.body;

    const imageFiles = req.files["images"] || [];
    const documentFiles = req.files["documents"] || [];

    const imageUrls = imageFiles.map(
      (file) =>
        `${process.env.BACKEND_URL}/uploads/Chats/${task_id}/${file.filename}`
    );
    const documentUrls = documentFiles.map(
      (file) =>
        `${process.env.BACKEND_URL}/uploads/Chats/${task_id}/${file.filename}`
    );

    const parsedData = {
      sender_id: parseInt(sender_id),
      receiver_id: parseInt(receiver_id),
      user_id: parseInt(user_id),
      property_id: parseInt(property_id),
      service_id: parseInt(service_id),
      task_id: parseInt(task_id),
      message: message || null,
      sender_read_status: sender_read_status || "sent",
    };

    const result = await sequelize.transaction(async (t) => {
      const query = `
        INSERT INTO chat (
          user_id,
          sender_id,
          receiver_id,
          message,
          images,
          documents,
          property_id,
          service_id,
          task_id,
          sender_read_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;

      const values = [
        parsedData.user_id,
        parsedData.sender_id,
        parsedData.receiver_id,
        parsedData.message,
        JSON.stringify(imageUrls),
        JSON.stringify(documentUrls),
        parsedData.property_id,
        parsedData.service_id,
        parsedData.task_id,
        parsedData.sender_read_status,
      ];

      const [insertedData] = await sequelize.query(query, {
        replacements: values,
        transaction: t,
        type: Sequelize.QueryTypes.INSERT,
      });

      return insertedData;
    });

    return res.status(201).json({
      success: true,
      message: "Chat inserted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error inserting chat:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
};
exports.getAllChatsByUserAndTask = async (req, res) => {
  try {
    const { user_id, task_id } = req.body;
    const result = await sequelize.transaction(async (t) => {
      const query = `SELECT
  c.*, 
  sender.first_name AS sender_first_name, 
  sender.last_name AS sender_last_name, 
  sender.email AS sender_email,
  receiver.first_name AS receiver_first_name, 
  receiver.last_name AS receiver_last_name, 
  receiver.email AS receiver_email
FROM chat c
INNER JOIN user sender ON sender.user_id = c.sender_id
INNER JOIN user receiver ON receiver.user_id = c.receiver_id
WHERE c.task_id = ?`;
      const list = await sequelize.query(query, {
        replacements: [task_id],
        transaction: t,
        type: Sequelize.QueryTypes.SELECT,
      });
      return list;
    });
    return res
      .status(200)
      .json({ message: "chats list fetched successfully", chats: result });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
};

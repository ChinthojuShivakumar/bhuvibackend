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

exports.getDashboard = async (req, res) => {
  try {
    const { user_id } = req.body;

    const AGENT_DASHBOARD_QUERY = `SELECT 
	(SELECT COUNT(*)  FROM task WHERE status = 'Pending' AND agent_id = ?) AS total_pending_task,
	(SELECT COUNT(*)  FROM task WHERE status = 'Completed' AND agent_id = ?) AS total_completed_task,
	(SELECT COUNT(*)  FROM task WHERE agent_id = ?) AS total_tasks,
    (SELECT COUNT(distinct property_id)  FROM task WHERE agent_id = ?) AS total_properties;`;

    const [rows] = await sequelize.query(AGENT_DASHBOARD_QUERY, {
      replacements: [user_id, user_id, user_id, user_id],
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

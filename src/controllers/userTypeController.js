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

exports.getAllUserTypeCategories = async (req, res) => {
  try {
    const query = `SELECT * FROM user_type_category WHERE user_type_category_name != 'SUPER ADMIN';`;

    const [results] = await sequelize.query(query, {
      raw: true,
    });

    if (results.length > 0) {
      return res.status(200).json({
        message: "User Type Categories Fetched Successfully",
        data: results,
      });
    } else {
      return res.status(404).json({
        message: "No User Type Categories Found",
        data: [],
      });
    }
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to set Channel Partner Promotion' });
    res.status(500).json({ message: error.message });
  }
};
exports.getAllUserType = async (req, res) => {
  try {
    const query = `SELECT * FROM user_type WHERE user_type_name != 'SUPER ADMIN' AND  user_type_name != 'ADMIN' AND is_active=1;`;

    const [results] = await sequelize.query(query, {
      raw: true,
    });

    if (results.length > 0) {
      return res.status(200).json({
        message: "User Type Categories Fetched Successfully",
        data: results,
      });
    } else {
      return res.status(404).json({
        message: "No User Type Categories Found",
        data: [],
      });
    }
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to set Channel Partner Promotion' });
    res.status(500).json({ message: error.message });
  }
};

const dotenv = require("dotenv");
const Sequelize = require("sequelize");
const dbConfig = require("../config/dbConfig");
const bcrypt = require("bcrypt");
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

exports.getAllCommissionListForSuperAdmin = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      const query = `SELECT
                          cm.*, 
                          c.company_name,
                          pbp.partner_builder_project_id,
                          pbp.partner_builder_project_name
                      FROM commission cm
                      LEFT JOIN company c ON cm.company_id = c.company_id
                      LEFT JOIN (
                          SELECT company_id, 
                                MIN(partner_builder_project_id) AS partner_builder_project_id,
                                MIN(partner_builder_project_name) AS partner_builder_project_name
                          FROM partner_builder_project
                          GROUP BY company_id
                      ) pbp ON cm.company_id = pbp.company_id
                      ORDER BY cm.commission_id;`;
      const franchiseList = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
        raw: true,
      });
      return franchiseList;
    });

    return res.status(200).json({
      message: "franchise partner fetched successfully",
      success: true,
      commissionList: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};

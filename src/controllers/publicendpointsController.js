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

exports.getAllCompanyList = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      const query = `SELECT * FROM company`;
      const franchiseList = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
        raw: true,
      });
      return franchiseList;
    });

    return res.status(200).json({
      message: "company list fetched successfully",
      success: true,
      companyList: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};
exports.getInTouch = async (req, res) => {
  try {
    console.log(req.body);
    const {
      first_name,
      last_name,
      mobile,
      email,
      area_of_intrest,
      message,

      company_id,
      slot_time = null,
      role = null,
      demo_type = null,
    } = req.body;
    if (!first_name || !last_name || !mobile || !email || !message) {
      throw new Error("Missing required fields in request body");
    }

    const company = req.body.company ? req.body.company : company_id;
    const areaOfIntrest =
      area_of_intrest === "string"
        ? JSON.parse(area_of_intrest)
        : JSON.stringify(area_of_intrest);

    const result = await sequelize.transaction(async (t) => {
      const query = `
  INSERT INTO get_in_touch 
  (first_name, last_name, mobile, email, area_of_intrest, message, company, created_at, slot_time, role, demo_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, NOW(),?,?,?)
`;

      const franchiseList = await sequelize.query(query, {
        type: sequelize.QueryTypes.INSERT,
        replacements: [
          first_name,
          last_name,
          mobile,
          email,
          areaOfIntrest, // since it's a JSON column
          message,
          company,
          slot_time,
          role,
          demo_type,
        ],
        transaction: t,
        raw: true,
      });

      return franchiseList;
    });

    return res.status(200).json({
      message:
        "Contact details inserted successfully..! Our Agent Will Contact You soon...",
      success: true,
      companyList: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};

exports.getAllFAQ = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      const query = `
            SELECT * FROM faqs WHERE status='Active';
`;

      const faqs = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,

        transaction: t,
        raw: true,
      });

      return faqs;
    });

    return res.status(200).json({
      message: "faq list fetched successfully",
      success: true,
      faqList: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};

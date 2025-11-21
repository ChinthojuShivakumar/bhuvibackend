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

exports.createFAQ = async (req, res) => {
  try {
    const { faq_question, faq_answer } = req.body;

    const result = await sequelize.transaction(async (t) => {
      const query = `
  INSERT INTO faqs 
  (faq_question, faq_answer, created_at, updated_at, status)
  VALUES (?, ?, NOW(), NOW(), 'Active')
`;

      const [ticket_id] = await sequelize.query(query, {
        type: sequelize.QueryTypes.INSERT,
        replacements: [faq_question, faq_answer],
        transaction: t,
        raw: true,
      });

      return { ticket_id: ticket_id };
    });

    return res.status(200).json({
      message: "faq added successfully",
      success: true,
      ticket: result,
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

exports.getSingleFAQ = async (req, res) => {
  try {
    const { faq_id } = req.params;
    const result = await sequelize.transaction(async (t) => {
      const query = `
 SELECT * FROM faqs WHERE faq_id = ?
`;

      const faq = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        replacements: [faq_id],
        transaction: t,
        raw: true,
      });

      return faq;
    });

    return res.status(200).json({
      message: "faq fetched successfully",
      success: true,
      ticketList: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};
exports.updateFAQ = async (req, res) => {
  try {
    const { faq_question, faq_answer, faq_id, status } = req.body;
    console.log(req.body);

    const result = await sequelize.transaction(async (t) => {
      const query = `
                    UPDATE faqs 
                    SET faq_question=?, faq_answer=?,  status=?, updated_at=NOW()
                    WHERE faq_id = ?
                `;

      const ticket = await sequelize.query(query, {
        type: sequelize.QueryTypes.UPDATE,
        replacements: [faq_question, faq_answer, status, faq_id],
        transaction: t,
        raw: true,
      });

      return ticket;
    });

    return res.status(200).json({
      message: "Faq has been updated",
      success: true,
      ticket: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};

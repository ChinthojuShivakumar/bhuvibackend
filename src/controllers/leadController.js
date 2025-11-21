const dotenv = require("dotenv");
const Sequelize = require("sequelize");
const dbConfig = require("../config/dbConfig");
const { sendEmail } = require("../services/emailService");
dotenv.config();
const bcrypt = require("bcrypt");

const db = require("../models");

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

exports.createLead = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      mobile,
      source,
      budjet,
      status,
      assigned_to = null,
      location,
      property_id = null,
      description,
      partnership_type,
      years_of_experiance,
      company_id = null,
      project_id = null,
      prev_companies = null,
      social_media = null,
    } = req.body;
    // console.log(req.body);

    // const result = await sequelize.transaction(async (t) => {
    const USER_SELECT_QUERY = `SELECT * FROM user WHERE email = ?`;
    const [user] = await sequelize.query(USER_SELECT_QUERY, {
      type: sequelize.QueryTypes.SELECT,
      replacements: [email],
      // transaction: t,
      raw: true,
    });
    if (user) {
      const USER_TYPE_MAPPING_SELECT_QUERY = `SELECT * FROM user_type_mapping WHERE user_id = ?`;

      const [userTypeMapping] = await sequelize.query(
        USER_TYPE_MAPPING_SELECT_QUERY,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: [user.user_id],
          // transaction: t,
          raw: true,
        }
      );

      if (user.user_id === userTypeMapping.user_id) {
        return res.status(400).json({ message: "email already exists" });
      }
    }
    const query = `
  INSERT INTO crm_leads 
  (first_name, last_name, email, mobile, source, budjet, status, assigned_to, location, property_id, description, partnership_type, 
  years_of_experiance, created_at, updated_at, company_id, project_id,prev_companies,social_media)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?, NOW(), NOW(),?,?,?,?)
`;

    const [lead_id] = await sequelize.query(query, {
      type: sequelize.QueryTypes.INSERT,
      replacements: [
        first_name,
        last_name,
        email,
        mobile,
        source,
        budjet,
        status,
        assigned_to,
        location,
        property_id,
        description,
        partnership_type,
        years_of_experiance,
        company_id,
        project_id,
        prev_companies,
        social_media,
      ],
      // transaction: t,
      raw: true,
    });

    // return { lead_id };
    // });

    return res.status(200).json({
      message: "Your form successfully submitted",
      success: true,
      lead: lead_id,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};

exports.getAllLeadList = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      //        SELECT
      //   cs.*,
      //   creator.first_name AS first_name,
      //   creator.last_name AS last_name,
      //   creator.email AS email,
      //   assignee.first_name AS assigned_first_name,
      //   assignee.last_name AS assigned_last_name,
      //   assignee.email AS assigned_email
      // FROM customer_support_tickets cs
      // LEFT JOIN user creator ON cs.user_id = creator.user_id
      // LEFT JOIN user assignee ON cs.assigned_to = assignee.user_id
      // ORDER BY cs.created_at DESC;
      // SELECT
      //       l.*,
      //       p.property_id,
      //       p.property_name,
      //       pbp.partner_builder_project_id,
      //       pbp.partner_builder_project_name,
      //       c.company_id,
      //       c.company_name
      //       FROM crm_leads l
      //       LEFT JOIN property p ON p.property_id = l.property_id
      //       LEFT JOIN partner_builder_project pbp ON pbp.partner_builder_project_id = l.project_id
      //       LEFT JOIN company c ON c.company_id = l.company_id
      //       WHERE l.status <> 'Qualified'

      // SELECT * FROM customer_support_tickets;
      const query = `
            SELECT
            l.*,
            p.property_id,
            p.property_name,
            pbp.partner_builder_project_id,
            pbp.partner_builder_project_name,
            c.company_id,
            c.company_name
            FROM crm_leads l
            LEFT JOIN property p ON p.property_id = l.property_id
            LEFT JOIN partner_builder_project pbp ON pbp.partner_builder_project_id = l.project_id
            LEFT JOIN company c ON c.company_id = l.company_id
            ;


`;

      const lead = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,

        transaction: t,
        raw: true,
      });
      lead.reverse();
      return lead;
    });

    return res.status(200).json({
      message: "lead list fetched successfully",
      success: true,
      leadList: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};

exports.getSingleLead = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const result = await sequelize.transaction(async (t) => {
      const query = `
 SELECT * FROM crm_leads WHERE lead_id = ?
`;

      const lead = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        replacements: [ticket_id],
        transaction: t,
        raw: true,
      });
      // console.log(ticket.ticket_id);
      return lead;
    });

    return res.status(200).json({
      message: "ticket fetched successfully",
      success: true,
      lead: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};
exports.updateLead = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      mobile,
      company,
      status,
      assigned_to = null,
      area_of_intrest,
      description,
      closed_at = null,
      lead_id,
    } = req.body;
    console.log(req.body);
    const safeAssignedTo = assigned_to === "" ? null : assigned_to;
    const result = await sequelize.transaction(async (t) => {
      const query = `
  UPDATE get_in_touch 
  SET 
    first_name = ?, 
    last_name = ?, 
    email = ?, 
    mobile = ?, 
    status = ?, 
    message = ?, 
    company = ?, 
    area_of_intrest = ?, 
    assigned_to = ?,
    closed_at = ?
  WHERE id = ?
`;

      const replacements = [
        first_name,
        last_name,
        email,
        mobile,
        status,
        description,
        company,
        JSON.stringify(area_of_intrest), // assuming it's stored as JSON in DB
        safeAssignedTo,
        closed_at,
        lead_id,
      ];

      const lead = await sequelize.query(query, {
        type: sequelize.QueryTypes.UPDATE,

        replacements: replacements,

        transaction: t,
        raw: true,
      });

      return lead;
    });

    return res.status(200).json({
      message: "Data has been updated",
      success: true,
      lead: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};
// exports.updateLead = async (req, res) => {
//   try {
//     const {
//       first_name,
//       last_name,
//       email,
//       mobile,
//       source,
//       budjet,
//       status,
//       assigned_to = null,
//       location,
//       property_id = null,
//       description,
//       partnership_type,
//       years_of_experiance,
//       lead_id,
//       project_id,
//       company_id,
//     } = req.body;
//     console.log(req.body);

//     const result = await sequelize.transaction(async (t) => {
//       const query = `
//                     UPDATE crm_leads
//                     SET
//                     first_name=?,
//                     last_name=?,
//                     email=?,
//                     mobile=?,
//                     source=?,
//                     budjet=?,
//                     status=?,
//                     assigned_to=?,
//                     location=?,
//                     property_id=?,
//                     description=?,
//                     partnership_type=?,
//                     years_of_experiance=?,
//                     company_id=?,
//                     project_id=?
//                     WHERE lead_id = ?
//                 `;

//       const lead = await sequelize.query(query, {
//         type: sequelize.QueryTypes.UPDATE,
//         replacements: [
//           first_name,
//           last_name,
//           email,
//           mobile,
//           source,
//           budjet,
//           status,
//           assigned_to,
//           location,
//           property_id,
//           description,
//           partnership_type,
//           years_of_experiance,
//           company_id,
//           project_id,
//           lead_id,
//         ],
//         transaction: t,
//         raw: true,
//       });

//       return lead;
//     });

//     return res.status(200).json({
//       message: "Data has been updated",
//       success: true,
//       lead: result,
//     });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ error: error, message: "Internal Server Error" });
//   }
// };

exports.getOpportunityList = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      const query = `
                  SELECT gt.*, u.first_name AS assigned_first_name, u.last_name AS assigned_last_name, u.mobile AS assigned_mobile, u.email AS assigned_email 
FROM bhv_pm_db.get_in_touch gt 
LEFT JOIN bhv_pm_db.user u ON u.user_id = gt.assigned_to 
WHERE gt.status = "Qualified";

                    `;
      //       const query = `
      //                     SELECT
      // l.*,
      // u.first_name AS assigned_first_name,
      // u.last_name AS assigned_last_name,
      // u.email AS assigned_email,
      // u.mobile AS assigned_mobile,
      // p.property_id,
      // p.property_name,
      // pbp.partner_builder_project_id,
      // pbp.partner_builder_project_name,
      // c.company_id,
      // c.company_name
      // FROM crm_leads l

      // LEFT JOIN property p ON p.property_id = l.property_id
      // LEFT JOIN partner_builder_project pbp ON pbp.partner_builder_project_id = l.project_id
      // LEFT JOIN company c ON c.company_id = l.company_id
      // INNER JOIN user u ON u.user_id = l.assigned_to
      // WHERE l.status = 'Qualified';

      //                     `;
      const opportunity = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
        raw: true,
      });

      // Restructure each lead to include assigned user as a nested object
      const formattedOpportunity = opportunity.map((lead) => {
        const {
          assigned_first_name,
          assigned_last_name,
          assigned_email,
          assigned_mobile,
          ...leadData
        } = lead;

        return {
          ...leadData,
          assigned_user: {
            first_name: assigned_first_name,
            last_name: assigned_last_name,
            email: assigned_email,
            mobile: assigned_mobile,
          },
        };
      });

      return formattedOpportunity;
    });

    return res.status(200).json({
      message: "opportunity fetched successfully",
      success: true,
      opportunityList: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};
exports.getPropertyListByProject = async (req, res) => {
  try {
    const { partner_builder_project_id, company_id } = req.body;
    const result = await sequelize.transaction(async (t) => {
      const query = `
                    SELECT property_id, property_name FROM property WHERE partner_builder_project_id = ? AND company_id = ?;
                    `;
      const properties = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        replacements: [partner_builder_project_id, company_id],
        transaction: t,
        raw: true,
      });
      return properties;
    });

    return res.status(200).json({
      message: "opportunity fetched successfully",
      success: true,
      propertyList: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};
exports.getCustomerPropertyAndCount = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      const query = `
                    SELECT DISTINCT
                        u.user_id, 
                        u.first_name, 
                        u.last_name, 
                        u.email, 
                        u.mobile,
                        utm.status, 
                        utm.is_active, 
                        u.created_at AS user_created_at,
                        p.property_name, 
                        p.property_id, 
                        p.created_at AS property_created_at,
                        prop_count.total_user_properties
                    FROM bhv_pm_db.user u
                    LEFT JOIN bhv_pm_db.user_type_mapping utm 
                        ON utm.user_id = u.user_id
                    LEFT JOIN (
                        SELECT p1.*
                        FROM bhv_pm_db.property p1
                        INNER JOIN (
                            SELECT user_id, MAX(created_at) AS max_created_at
                            FROM bhv_pm_db.property
                            GROUP BY user_id
                        ) p2 ON p1.user_id = p2.user_id AND p1.created_at = p2.max_created_at
                    ) p ON p.user_id = u.user_id
                    LEFT JOIN (
                        SELECT user_id, COUNT(*) AS total_user_properties
                        FROM bhv_pm_db.property
                        GROUP BY user_id
                    ) prop_count ON prop_count.user_id = u.user_id
                    WHERE utm.user_type_id = 3;
                    `;
      const customerPropertyList = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
        raw: true,
      });

      const customerProperties = customerPropertyList.map((customer) => {
        const {
          user_id,
          first_name,
          last_name,
          email,
          status,
          user_created_at,
          mobile,
          property_id,
          property_name,
          property_created_at,
          total_user_properties,
        } = customer;

        return {
          property: { property_id, property_name, property_created_at },
          user: {
            user_id,
            first_name,
            last_name,
            email,
            status,
            user_created_at,
            mobile,
            total_user_properties,
          },
        };
      });

      return customerProperties;
    });

    return res.status(200).json({
      message: "crm customers fetched successfully",
      success: true,
      customerList: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};
exports.getAgentList = async (req, res) => {
  try {
    const company_id = req.query?.company_id || null;

    const result = await sequelize.transaction(async (t) => {
      let query = `
        SELECT u.* FROM user u 
        INNER JOIN user_type_mapping utm ON utm.user_id = u.user_id
        WHERE utm.user_type_id = 4
      `;

      // Add company_id filter if provided
      if (company_id) {
        query += ` AND u.company_id = '${company_id}'`;
      }

      const agentList = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
        raw: true,
      });

      return agentList;
    });

    return res.status(200).json({
      message: "CRM agents fetched successfully",
      success: true,
      agentList: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error.message, message: "Internal Server Error" });
  }
};

exports.getAllLeadsListForSuperAdmin = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      // SELECT * FROM get_in_touch WHERE status <> "Qualified"
      let query = `
        SELECT * FROM get_in_touch WHERE status <> "Qualified";
      `;

      const leadList = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
        raw: true,
      });

      return leadList;
    });

    return res.status(200).json({
      message: "CRM Leads fetched successfully",
      success: true,
      leadList: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error.message, message: "Internal Server Error" });
  }
};

exports.updatePartner = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      mobile,
      company = "",
      status,
      assigned_to = "",
      area_of_intrest = [],
      description = "",
      lead_id,
    } = req.body;
    console.log(req.body);
    const safeAssignedTo = assigned_to === "" ? null : assigned_to;
    // const result = await sequelize.transaction(async (t) => {
    const query = `
  UPDATE crm_leads 
  SET 
    first_name = ?, 
    last_name = ?, 
    email = ?, 
    mobile = ?, 
    status = ?, 
    description = ?, 
    assigned_to = ?
  WHERE lead_id = ?
`;

    const partner = await sequelize.query(query, {
      type: sequelize.QueryTypes.UPDATE,

      replacements: [
        first_name,
        last_name,
        email,
        mobile,
        status,
        description,

        safeAssignedTo,
        lead_id,
      ],

      // transaction: t,
      raw: true,
    });

    const SELECT_QUALIFIED_PARTNER = `SELECT * FROM crm_leads WHERE lead_id = ? AND status = "Qualified"`;

    const [qualifiedPartner] = await sequelize.query(SELECT_QUALIFIED_PARTNER, {
      replacements: [lead_id],
    });

    if (qualifiedPartner && qualifiedPartner[0]?.status == "Qualified") {
      // console.log(qualifiedPartner, "qpp");

      const password = `${qualifiedPartner[0].email
        .split("@")[0]
        .slice(0, 5)}@123`;

      // console.log(password, "pass");

      const userPayload = {
        first_name: qualifiedPartner[0].first_name,
        last_name: qualifiedPartner[0].last_name,
        email: qualifiedPartner[0].email,
        mobile: qualifiedPartner[0].mobile,
        user_type_id: 14,
        password: password, // first 5 letters from email eg: manis@123
      };

      try {
        await addFranchisePartnerToUserTable(userPayload);
      } catch (error) {
        console.log(error);

        return res
          .status(500)
          .json({ message: "qualified user onboarding failed", error });
      }
    }

    // return partner;
    // });

    return res.status(200).json({
      message: "Data has been updated",
      success: true,
      lead: partner,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};
exports.getCRMDashboardCount = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      const query = `
                    SELECT
    (SELECT COUNT(*) FROM get_in_touch WHERE status = 'NEW') AS total_new_leads,
    (SELECT COUNT(*) FROM get_in_touch WHERE status = 'Qualified') AS total_qualified_leads,
    (SELECT COUNT(*) FROM get_in_touch WHERE status = 'Proposal') AS total_proposal_leads,
    (SELECT COUNT(*) FROM get_in_touch WHERE status = 'Closed') AS total_closed_leads,
    (SELECT COUNT(*) FROM get_in_touch) AS total_leads,
    (SELECT COUNT(*) FROM get_in_touch WHERE MONTH(created_at) = MONTH(CURRENT_DATE) AND YEAR(created_at) = YEAR(CURRENT_DATE)) AS current_month_leads,
    (SELECT COUNT(*) FROM get_in_touch WHERE MONTH(created_at) = MONTH(CURRENT_DATE - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(CURRENT_DATE - INTERVAL 1 MONTH)) AS previous_month_leads,
    (SELECT COUNT(*) FROM get_in_touch WHERE status = 'Qualified' AND MONTH(created_at) = MONTH(CURRENT_DATE) AND YEAR(created_at) = YEAR(CURRENT_DATE)) AS current_month_qualified,
    (SELECT COUNT(*) FROM get_in_touch WHERE status = 'Qualified' AND MONTH(created_at) = MONTH(CURRENT_DATE - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(CURRENT_DATE - INTERVAL 1 MONTH)) AS previous_month_qualified;
                    `;
      const [data] = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
        raw: true,
      });
      const {
        current_month_leads,
        previous_month_leads,
        current_month_qualified,
        previous_month_qualified,
        ...properties
      } = data;

      const totalChange = previous_month_leads
        ? ((current_month_leads - previous_month_leads) /
            previous_month_leads) *
          100
        : 0;

      const qualifiedChange = previous_month_qualified
        ? ((current_month_qualified - previous_month_qualified) /
            previous_month_qualified) *
          100
        : 0;

      return {
        ...properties,
        current_month_leads,
        previous_month_leads,
        total_lead_percentage: `${totalChange.toFixed(2)}%`,
        current_month_qualified,
        previous_month_qualified,
        total_qualified_percentage: `${qualifiedChange.toFixed(2)}%`,
      };
    });

    return res.status(200).json({
      message: "dashboard data fetched successfully",
      success: true,
      dashboard: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};

async function addFranchisePartnerToUserTable(customer) {
  const {
    email,
    password,
    user_type_id,
    first_name,
    last_name,
    mobile,
    referral_code,
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
      // const otp = generateOTP(); // ✅ This uses your STATIC_OTP properly
      // console.log("Generated OTP (to be saved in DB) ===", otp);
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
          // email_otp: otp,
        },
        { transaction: t }
      );

      user_id = newUser.user_id;

      // //const email_body = `Your verification OTP is: ${otp}`;//Modified on 30-05-2024
      // const email_body = `Please remember that your One-Time Password (OTP) is confidential and should never be shared with anyone.\n\nYour OTP for email verification is: ${otp}\n\nRegards,\nBhuvi RealTech`;
      // await emailService.sendVerificationEmail(email, email_body);
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

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

exports.createTicket = async (req, res) => {
  try {
    const {
      subject,
      user_id,
      email,
      priority_level,
      status,
      description,
      assigned_to,
      created_at,
      closed_at,
      ticket_type,
    } = req.body;
    console.log(req.body);

    const result = await sequelize.transaction(async (t) => {
      // const [user] = await sequelize.query(
      //   `SELECT user_id FROM user WHERE email = ?`,
      //   {
      //     type: sequelize.QueryTypes.SELECT,
      //     replacements: [email],
      //     transaction: t,
      //     raw: true,
      //   }
      // );

      // const user_id = user.user_id;

      // if (!user_id) {
      //   return res.status(400).json({
      //     message: "user in not assisated with company/org.",
      //     success: false,
      //   });
      // }
      const query = `
  INSERT INTO customer_support_tickets 
  (subject, priority_level, status, assigned_to, created_at, closed_at, ticket_type, description, user_email, user_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)
`;

      const [ticket_id] = await sequelize.query(query, {
        type: sequelize.QueryTypes.INSERT,
        replacements: [
          subject,
          priority_level,
          status,
          assigned_to,
          created_at,
          closed_at,
          ticket_type,
          description,
          email,
          user_id,
        ],
        transaction: t,
        raw: true,
      });

      const ticketCustomId = `TKT-${String(ticket_id).padStart(6, "0")}`;
      await sequelize.query(
        `UPDATE customer_support_tickets SET unique_id = ? WHERE ticket_id =?`,
        {
          type: sequelize.QueryTypes.UPDATE,
          replacements: [ticketCustomId, ticket_id],
          transaction: t,
          raw: true,
        }
      );
      subjectEmail = `Your Ticket  has been Raised ${ticketCustomId}`;
      const message = `<div>
      <p>Your Ticket  has been Raised <b>${ticketCustomId}</b> </p>
      <p>Subject: <b style:"color:'red'">${subject}</b> </p>
      <p>Description: <b style:"color:'red'">${description}</b> </p>
      <p>Category: <b style:"color:'red'">${ticket_type}</b> </p>
      <p>Priority Level: <b style:"color:'red'">${priority_level}</b> </p>
      <p>Status: <b style:"color:'red'">${status}</b> </p>
      <p>Thanks for contacting</p>
      <p>Garudalytics Pvt.Ltd</p>
      </div>`;

      await sendEmail(email, message, subjectEmail, true);
      return { ticket_id: ticket_id };
    });

    return res.status(200).json({
      message: "You have successfully raised ticket",
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

exports.getAllTickets = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      //       const query = `
      //             SELECT * FROM customer_support_tickets;
      // `;
      const query = `
           SELECT
        cs.*,
        creator.first_name AS first_name,
        creator.last_name AS last_name,
        creator.email AS email,
        assignee.first_name AS assigned_first_name,
        assignee.last_name AS assigned_last_name,
        assignee.email AS assigned_email
      FROM customer_support_tickets cs
      LEFT JOIN user creator ON cs.user_id = creator.user_id
      LEFT JOIN user assignee ON cs.assigned_to = assignee.user_id
      ORDER BY cs.created_at DESC;
`;

      const ticket = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,

        transaction: t,
        raw: true,
      });
      ticket.reverse();
      return ticket;
    });

    return res.status(200).json({
      message: "tickets list fetched successfully",
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

exports.getSingleTicket = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const result = await sequelize.transaction(async (t) => {
      const query = `
 SELECT * FROM customer_support_tickets WHERE ticket_id = ?
`;

      const ticket = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        replacements: [ticket_id],
        transaction: t,
        raw: true,
      });
      console.log(ticket.ticket_id);
      return ticket;
    });

    return res.status(200).json({
      message: "ticket fetched successfully",
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
exports.updateTicket = async (req, res) => {
  try {
    const {
      subject,
      email,
      priority_level,
      status,
      assigned_to,
      updated_at,
      closed_at = null,
      ticket_type,
      ticket_id,
      description,
    } = req.body;
    console.log(req.body);
    const assignedTo = JSON.stringify(assigned_to);

    const result = await sequelize.transaction(async (t) => {
      // const [user] = await sequelize.query(
      //   `SELECT user_id FROM user WHERE email = ?`,
      //   {
      //     type: sequelize.QueryTypes.SELECT,
      //     replacements: [email],
      //     transaction: t,
      //     raw: true,
      //   }
      // );

      // const user_id = user.user_id;

      // if (!user_id) {
      //   return res.status(400).json({
      //     message: "user in not assisated with company/org.",
      //     success: false,
      //   });
      // }
      const query = `
                    UPDATE customer_support_tickets 
                    SET subject=?, 
                    user_email=?,
                    priority_level=?,
                    status=?,
                    assigned_to=?,
                    updated_at=?,
                    closed_at=?,
                    ticket_type=?,
                    description=?
                    WHERE ticket_id = ?
                `;

      const ticket = await sequelize.query(query, {
        type: sequelize.QueryTypes.UPDATE,
        replacements: [
          subject,
          email,
          priority_level,
          status,
          assignedTo,
          updated_at,
          closed_at,
          ticket_type,
          description,
          ticket_id,
        ],
        transaction: t,
        raw: true,
      });

      if (assigned_to != null) {
        const ASSIGNED_AGENT_QUERY = `SELECT * FROM user WHERE user_id = ?`;

        const fetchAgent = await sequelize.query(ASSIGNED_AGENT_QUERY, {
          type: sequelize.QueryTypes.SELECT,
          replacements: [assigned_to],
          transaction: t,
          raw: true,
        });

        const fetchedAgent = fetchAgent[0];

        subjectEmail = `Agent has been assigned to your ticket`;
        const message = `<div>
      <p>Your Ticket Status has been Updated. </p>
      <p>Subject: <b style:"color:'red'">${subject}</b> </p>
      <p>Description: <b style:"color:'red'">${description}</b> </p>
      <p>Category: <b style:"color:'red'">${ticket_type}</b> </p>
      <p>Priority Level: <b style:"color:'red'">${priority_level}</b> </p>
      <p>Status: <b style:"color:'red'">${status}</b> </p>
      <p>Agent Details: <div style:"color:'red'">
      <p>${fetchedAgent.first_name}</p>
      <p>${fetchedAgent.last_name}</p>
      <p>${fetchedAgent.email}</p>
      </div> </p>
      <p>Thanks for contacting</p>
      <p>Garudalytics Pvt.Ltd</p>
      </div>`;
        await sendEmail(fetchedAgent.email, message, subjectEmail, true);
      }

      subjectEmail = `Your Ticket Status  has been Updated`;
      const message = `<div>
      <p>Your Ticket Status has been Updated. </p>
      <p>Subject: <b style:"color:'red'">${subject}</b> </p>
      <p>Description: <b style:"color:'red'">${description}</b> </p>
      <p>Category: <b style:"color:'red'">${ticket_type}</b> </p>
      <p>Priority Level: <b style:"color:'red'">${priority_level}</b> </p>
      <p>Status: <b style:"color:'red'">${status}</b> </p>
      <p>Thanks for contacting</p>
      <p>Garudalytics Pvt.Ltd</p>
      </div>`;

      await sendEmail(email, message, subjectEmail, true);
      return ticket;
    });

    return res.status(200).json({
      message: "Issue has been updated",
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

exports.getAllCountData = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const result = await sequelize.transaction(async (t) => {
      const query = `
SELECT 
	(SELECT COUNT(*)  FROM customer_support_tickets WHERE ticket_type = 'technical') AS total_technical_count,
    (SELECT COUNT(*)  FROM customer_support_tickets WHERE ticket_type = 'general') AS total_general_count,
	(SELECT COUNT(*)  FROM customer_support_tickets WHERE ticket_type = 'billing') AS total_billing_count,
    (SELECT COUNT(*) FROM customer_support_tickets) AS total_tickets,
	(SELECT COUNT(*) FROM customer_support_tickets  WHERE status='Pending')  AS total_pending_tickets,
	(SELECT COUNT(*) FROM customer_support_tickets WHERE status='Resolved')  AS total_resolved_tickets ,
	(SELECT COUNT(*) FROM customer_support_tickets  WHERE priority_level='high')  AS total_high_priority,
	(SELECT COUNT(*) FROM customer_support_tickets)  AS total_score;
`;

      const ticket = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        replacements: [ticket_id],
        transaction: t,
        raw: true,
      });
      const {
        total_technical_count,
        total_general_count,
        total_billing_count,
        total_tickets,
        total_pending_tickets,
        total_resolved_tickets,
        total_high_priority,
        total_score,
      } = ticket[0];
      const totalTechnicalPercentage =
        (total_technical_count * 100) / total_tickets;
      const totalBillingPercentage =
        (total_billing_count * 100) / total_tickets;
      const totalGeneralPercentage =
        (total_general_count * 100) / total_tickets;

      const ticketList = await sequelize.query(
        "SELECT * FROM customer_support_tickets",
        {
          type: sequelize.QueryTypes.SELECT,
          transaction: t,
          raw: true,
        }
      );

      const totalResponseTime = ticketList.reduce((sum, t) => {
        if (t.closed_at)
          return sum + (t.closed_at = t.created_at) / (1000 * 60);
        return sum;
      }, 0);
      const averageResponseTime = totalResponseTime / 60 / ticketList.length;
      const finalResult = {
        total_technical_percentage: total_technical_count,
        total_billing_percentage: total_billing_count,
        total_general_percentage: total_general_count,
        total_tickets,
        total_pending_tickets,
        total_resolved_tickets,
        total_high_priority,
        total_score,
        total_average_respone_time: Number(averageResponseTime.toFixed(1)),
      };
      return finalResult;
    });

    return res.status(200).json({
      message: "ticket counts successfully",
      success: true,
      countData: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error, message: "Internal Server Error" });
  }
};

exports.getAllTicketsByUser = async (req, res) => {
  try {
    const { user_id } = req.body;
    const result = await sequelize.transaction(async (t) => {
      //        SELECT
      //   cs.*,
      //   creator.first_name AS first_name,
      //   creator.last_name AS last_name,
      //   creator.email AS email,
      //   assignee.first_name AS assigned_first_name,
      //   assignee.last_name AS assigned_last_name,
      //   assignee.email AS assigned_email
      // FROM bhv_pm_db.customer_support_tickets cs
      // LEFT JOIN bhv_pm_db.user creator ON cs.user_id = creator.user_id
      // LEFT JOIN bhv_pm_db.user assignee ON cs.assigned_to = assignee.user_id
      // ORDER BY cs.created_at DESC;

      // SELECT * FROM bhv_pm_db.customer_support_tickets;
      const query = `
            SELECT * FROM customer_support_tickets WHERE user_id = ?;

`;

      const ticket = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        replacements: [user_id],
        transaction: t,
        raw: true,
      });
      ticket.reverse();
      return ticket;
    });

    return res.status(200).json({
      message: "tickets list fetched successfully",
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

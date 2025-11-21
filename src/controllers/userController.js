// src/controllers/userController.js
const { where } = require("sequelize");
const db = require("../models");
const { getFileUrl } = require("../utils/utils");
const dotenv = require("dotenv");
const Sequelize = require("sequelize");
dotenv.config();
const dbConfig = require("../config/dbConfig");
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
// Get properties for the requested user
exports.getPropertiesForUser = async (req, res) => {
  try {
    const { user_id, user_type_category_id, user_type_mapping_id } = req.user;
    let where_condition;
    let attributes = ["first_name", "last_name"];
    let include = [];
    console.log(user_id, user_type_category_id, user_type_mapping_id);

    if (user_type_category_id === 3) {
      where_condition = { user_id };
    } else if (user_type_category_id === 5) {
      const partnerBuilder = await db.PartnerBuilder.findOne({
        where: { user_type_mapping_id },
      });

      const company_id = partnerBuilder.company_id;

      where_condition = { company_id };
      include.push({
        model: db.PartnerBuilderProject,
        attributes: ["partner_builder_project_name"],
        as: "partner_builder_project",
      });
    } else if (user_type_category_id === 1 || user_type_category_id === 2) {
      attributes.push("user_id");
    }

    include.push({
      model: db.User,
      attributes,
      as: "user",
    });

    const properties = await db.Property.findAll({
      include,
      where: { ...where_condition, is_active: 1 },
    });

    const propertiesWithFiles = await Promise.all(
      properties.map(async (property) => {
        const propertyData = property.toJSON();
        // ensure images and documents are in proper json array format 2024-05-13
        // const images = await (propertyData.images.length ? JSON.parse(propertyData.images) : []);
        // const documents = await (propertyData.documents.length ? JSON.parse(propertyData.documents) : []);

        let images = await (propertyData?.images?.length
          ? JSON.parse(propertyData.images)
          : []);
        let documents = await (propertyData?.documents?.length
          ? JSON.parse(propertyData.documents)
          : []);
        if (typeof images === "string") {
          images = JSON.parse(images);
        }
        if (typeof documents === "string") {
          documents = JSON.parse(documents);
        }

        // const imageUrls = await Promise.all(
        //   images.map(async (image) => {
        //     // const imageUrl = await getFileUrl(image);
        //     const imageUrl = `${process.env.BACKEND_URL}/${image}`;
        //     return imageUrl;
        //   })
        // );

        // const documentUrls = await Promise.all(
        //   documents.map(async (document) => {
        //     // const documentUrl = await getFileUrl(document);
        //     const documentUrl = `${process.env.BACKEND_URL}/${document}`;
        //     return documentUrl;
        //   })
        // );
        const imageUrls = images.map((image) => {
          // const imageUrl = await getFileUrl(image);
          const imageUrl = `${process.env.BACKEND_URL}/${image}`;
          return imageUrl;
        });
        const documentUrls = documents.map((document) => {
          // const documentUrl = await getFileUrl(document);
          const documentUrl = `${process.env.BACKEND_URL}/${document}`;
          return documentUrl;
        });

        propertyData.images = images;
        propertyData.imagesUrls = imageUrls;
        propertyData.documents = documents;
        propertyData.documentsUrls = documentUrls;

        return propertyData;
      })
    );

    res.status(200).json({ properties: propertiesWithFiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
};

// user dashboard
exports.userDashboard = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const query = `
      SELECT
        p.property_name,
        p.prop_unique_id,
        GROUP_CONCAT(DISTINCT s.service_name SEPARATOR ', ') AS services,
        sub.start_date AS subscription_start_date,
        sub.end_date AS subscription_end_date,
        sub.created_at AS subscription_creation_date,
        sub.subscription_id,
        sub.invoice,
        sub.invoice_no,
        sub.status AS subscription_status,
        sub.invoice_date, 
        sub.invoice_from_address, 
        sub.invoice_to_address, 
        sub.invoice_to_name,
        sub.invoice_property_name, 
        sub.invoice_package_name, 
        sub.invoice_area,
        sub.package_price,
        pkg.package_name,
        pkg.status AS package_status
      FROM
        property AS p
      LEFT JOIN
        subscription AS sub ON p.property_id = sub.property_id
      LEFT JOIN
        package AS pkg ON sub.package_id = pkg.package_id
      LEFT JOIN
        package_service AS ps ON pkg.package_id = ps.package_id
      LEFT JOIN
        service AS s ON ps.service_id = s.service_id
      WHERE
        p.user_id = :userId
      GROUP BY
        p.property_id, sub.subscription_id
    `;

    const propertyDetails = await db.sequelize.query(query, {
      replacements: { userId },
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (!propertyDetails || propertyDetails.length === 0) {
      return res
        .status(200)
        .json({ error: "No properties found for the user" });
    }

    const propertiesWithFiles = await Promise.all(
      propertyDetails.map(async (propertyData) => {
        const invoices = await (propertyData.invoice &&
        propertyData.invoice.length
          ? JSON.parse(propertyData.invoice)
          : []);

        const invoiceUrls = await Promise.all(
          invoices.map(async (invoice) => {
            const invoiceUrl = await getFileUrl(invoice);
            return invoiceUrl;
          })
        );

        propertyData.invoices = invoices;
        propertyData.invoicesUrls = invoiceUrls;

        return propertyData;
      })
    );

    res.status(200).json({ properties: propertiesWithFiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch property details" });
  }
};

exports.getReferredBy = async (req, res) => {
  try {
    const { user_id } = req.user;
    const referred_by = await db.User.findByPk(user_id, {
      attributes: ["referred_by"],
    });

    res.status(200).json({ referred_by });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get Referred By" });
  }
};
exports.property_package_valid = async (req, res) => {
  try {
    //  const { package_id} = req.params;
    const { package_id } = req.body;
    console.log("pkgId", package_id);
    const package_id_1 = package_id;
    const queryforcount = `select count(package_id) as count from package where package_id= ${package_id_1} and is_active=1`;
    let CountDetails = await db.sequelize.query(queryforcount, {
      type: db.sequelize.QueryTypes.SELECT,
    });
    const exist_count = CountDetails[0].count;
    console.log("exist_count", exist_count);
    res.status(200).json({ exist_count });
  } catch (error) {
    console.error(error);
    //   res.status(500).json({ error: 'Failed to get Referred By' });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const { user_id } = req.body;

    const CUSTOMER_DASHBOARD_QUERY = `SELECT 
	(SELECT COUNT(*)  FROM property WHERE is_active = 1 AND user_id = ?) AS total_properties,
	(SELECT COUNT(*)  FROM property WHERE is_verified = 1 AND user_id = ?) AS total_verified,
    (SELECT COUNT(*)  FROM property WHERE is_verified = 0 AND user_id = ?) AS total_un_verified;`;

    const [rows] = await sequelize.query(CUSTOMER_DASHBOARD_QUERY, {
      replacements: [user_id, user_id, user_id],
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

exports.getBillingListByUser = async (req, res) => {
  try {
    const { user_id } = req.body;
    const BILLING_LIST_QUERY_FOR_USER = `SELECT rp.*,s.*, p.*, u.first_name, u.last_name, u.email, utm.* FROM payment rp 
INNER JOIN subscription s ON s.subscription_id = rp.subscription_id
INNER JOIN property p ON p.property_id = s.property_id
INNER JOIN package pkg ON pkg.package_id = s.package_id
INNER JOIN user u ON u.user_id = rp.user_id
INNER JOIN user_type_mapping utm  ON utm.user_id = rp.user_id
WHERE rp.user_id = ?`;
    const rows = await sequelize.query(BILLING_LIST_QUERY_FOR_USER, {
      replacements: [user_id],
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });
    const result_data = rows;

    const final_result = await result_data.map((result) => {
      const user_details = {
        first_name: result.first_name,
        last_name: result.last_name,
        email: result.email,
        user_id: result.user_id,
        unique_id: result.unique_id,
      };

      const razorpay_payment_details = {
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_order_id: result.razorpay_order_id,
        order_amount: result.order_amount,
        order_gst_amount: result.order_gst,
      };

      const property_details = {
        property_id: result.property_id,
        property_name: result.property_name,
        prop_unique_id: result.prop_unique_id,
      };

      const invoice_details = {
        invoice_id: result.invoice_no,
        invoice_to_name: result.invoice_to_name,
        invoice_area: result.invoice_area,
        invoice_to_town: result.invoice_to_town,
        invoice_to_mandal: result.invoice_to_mandal,
        invoice_to_city: result.invoice_to_city,
        invoice_to_state: result.invoice_to_state,
        invoice_to_pincode: result.invoice_to_pincode,
        invoice_property_address: result.invoice_property_address,
        invoice_to_mobile: result.invoice_to_mobile,
        invoice_to_email: result.invoice_to_email,
      };

      return {
        user_details,
        razorpay_payment_details,
        property_details,
        invoice_details,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Data Retrived Successfully..!",
      billing: final_result,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
};

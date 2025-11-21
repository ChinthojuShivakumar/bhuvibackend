const { Property, Subscription, Package } = require("../models");
const { getUserById } = require("../services/userService");
const db = require("../models");
const { getFileUrl, handleUploadedFiles } = require("../utils/utils");
const { createTasks } = require("../services/taskService");
const { sendEmailToSuperadmins } = require("../services/authService");
const { sendEmail } = require("../services/emailService");
const packageService = require("../services/packageService");
const { processPayment } = require("../services/payment");
const { where } = require("sequelize");
const csv = require("csv-parser");
const fs = require("fs");

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

// TODO: break this function into smaller functions
exports.addProperty = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      property_name,
      description,
      address,
      town,
      mandal,
      partner_builder_project_id,
      city,
      state,
      country,
      pincode,
      area,
      lat,
      long,
      package_price: request_package_price,
      payment: req_payment,
      package_name,
      set_invoice_date,
      invoice_from_address,
      invoice_to_address,
      invoice_to_name,
      invoice_property_name,
      invoice_package_name,
      invoice_area,
      invoice_unique_id,
      propertyUnquiID,
      city_code,
      state_code,
      verification_status = "Pending",
    } = req.body;

    const {
      user_id: created_by,
      user_type_mapping_id: request_user_type_mapping_id,
      user_type_category_id,
    } = req.user; // The one making the request
    let user_id = req.body.user_id; // If admin creates the property we take user_id from body
    console.log("stateCode=====cityCode", state_code + "========" + city_code);
    const st_code = state_code;
    const ct_code = city_code;
    let mobile, admin_authorised, user;
    let company_id = null;
    let package_price = request_package_price;
    let payment = req_payment;
    let status = "Pending";
    if (user_type_category_id === 3) {
      user = req.user;
      user_id = user.user_id;
      mobile = user.mobile;
      admin_authorised = 0;
    } else if (
      !(
        created_by === user_id ||
        req.user.is_superadmin ||
        req.user.is_admin ||
        partner_builder_project_id
      )
    ) {
      throw Error("You are not authorised to add property for another user.");
    } else if (partner_builder_project_id && user_type_category_id === 5) {
      user_id = null;
      mobile = null;
      admin_authorised = 0;

      const project = await db.PartnerBuilderProject.findByPk(
        partner_builder_project_id,
        { transaction }
      );
      company_id = project.company_id;
      payment = payment || project.payment;
      status = payment === "Prepaid" ? "Active" : status;
    } else if (
      (user_type_category_id === 1 || user_type_category_id === 2) &&
      user_id
    ) {
      user = await getUserById(user_id);
      mobile = user.mobile;
      admin_authorised = 0;
    }

    let package_id = req.body.package_id;
    let package = await Package.findByPk(package_id, { transaction });
    // const package_price_slab = await packageService.getPackagePriceByArea(package_id, area, { transaction });

    if (!package && !partner_builder_project_id && isNaN(package)) {
      throw Error("package_id is missing");
    } else if (partner_builder_project_id && (!package || isNaN(package))) {
      let package_name = "Basic";
      package = await packageService.getPackageByName(package_name, {
        transaction,
      });
      package_id = package.package_id;

      package_price = await package.package_id;
      // package_price = await packageService.getPackagePriceByArea(
      //   package_id,
      //   area,
      //   { transaction }
      // );
      console.log(package_price, "package_price");

      if (!package_price) {
        throw Error(
          "Please contact Bhuvi admin as the Area of the property is above the designated slab."
        );
      }
    }
    const package_slab = await packageService.getPackagePriceByAreaSlab(
      package_id,
      area,
      { transaction }
    );
    let slab_level, price_level;
    if (package_slab != null) {
      const slabparts = package_slab.split("-"); // Split the slabparts string by '-'
      const slab_name = slabparts[0];
      if (slab_name == "slab_1") {
        slab_level = "slab_1";
        price_level = "package_price_1";
      } else if (slab_name == "slab_2") {
        slab_level = "slab_2";
        price_level = "package_price_2";
      } else if (slab_name == "slab_3") {
        slab_level = "slab_3";
        price_level = "package_price_3";
      } else if (slab_name == "slab_4") {
        slab_level = "slab_4";
        price_level = "package_price_4";
      } else if (slab_name == "slab_5") {
        slab_level = "slab_5";
        price_level = "package_price_5";
      } else if (slab_name == "slab_6") {
        slab_level = "slab_6";
        price_level = "package_price_6";
      } else if (slab_name == "slab_7") {
        slab_level = "slab_7";
        price_level = "package_price_7";
      } else if (slab_name == "slab_8") {
        slab_level = "slab_8";
        price_level = "package_price_8";
      } else if (slab_name == "slab_9") {
        slab_level = "slab_9";
        price_level = "package_price_9";
      }
    } else {
      slab_level = null;
      price_level = null;
    }
    const images = req.files["images"] || [];
    const documents = req.files["documents"] || [];
    if (partner_builder_project_id != undefined) {
      const existingProperty = await Property.findOne({
        where: {
          property_name,
          partner_builder_project_id,
        },
      });
      if (existingProperty) {
        console.log("Property already exists:", existingProperty);
        await transaction.rollback();
        return res.status(400).json({
          message:
            "The entered plot number already exists for this project. Please enter a different plot number",
        });
      }
    }

    const queryforcount_pr = `select count(property_id) as count  from property`;
    let CountDetailsPr = await db.sequelize.query(queryforcount_pr, {
      type: db.sequelize.QueryTypes.SELECT,
    });
    const uniqueIdCount = CountDetailsPr[0].count;
    const getCount = uniqueIdCount + 1;
    const idString = getCount.toString().padStart(7, "0");
    const property_no = propertyUnquiID + idString;
    console.log("property_no_Final=====" + property_no);
    const property = await Property.create(
      {
        property_name,
        description,
        mobile,
        area,
        lat,
        long,
        address,
        town,
        mandal,
        city,
        state,
        pincode,
        country,
        images: [],
        documents: [],
        user_id,
        partner_builder_project_id: partner_builder_project_id || null,
        company_id,
        payment: payment || null,
        created_by,
        last_update_by: created_by,
        prop_unique_id: property_no,
        state_code: st_code,
        city_code: ct_code,
        request_user_type_mapping_id,
        package_id,
        verification_status,
      },
      { transaction }
    );

    await handleUploadedFiles(
      images,
      "images",
      user_id || created_by,
      property
    );
    await handleUploadedFiles(
      documents,
      "documents",
      user_id || created_by,
      property
    );
    await property.save({ transaction });
    let formattedDate;
    const queryforcount = `select count(subscription_id) as count  from subscription where MONTH(invoice_date)=MONTH(now()) and YEAR(invoice_date)=YEAR(now()) and status='Active'`;
    let CountDetails = await db.sequelize.query(queryforcount, {
      type: db.sequelize.QueryTypes.SELECT,
    });
    // const invoice_count = CountDetails[0].count;

    const invoice_count = CountDetails[0].count;
    const getCountIn = invoice_count + 1;
    const idStringIn = getCountIn.toString().padStart(5, "0");
    let invoice_no_unq;
    if (status === "Active") {
      formattedDate = set_invoice_date
        ? db.sequelize.literal("CURDATE()")
        : null;
      invoice_no_unq = invoice_unique_id + idStringIn;
      console.log("invoice_no_unq ==If====", invoice_no_unq);
    } else {
      formattedDate = null;
      invoice_no_unq = null;
      console.log("invoice_no_unq ==Else If====", invoice_no_unq);
    }
    console.log("invoice_count_final=====" + invoice_no_unq);

    let subscription;
    if (package) {
      const start_date = admin_authorised
        ? db.sequelize.literal("CURRENT_TIMESTAMP")
        : null;
      const end_date = admin_authorised
        ? db.sequelize.literal("DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR)")
        : null;
      //const formattedDate = set_invoice_date ? db.sequelize.literal('CURDATE()') : null;
      subscription = await Subscription.create(
        {
          property_id: property.property_id,
          package_id,
          package_price,
          user_id,
          status,
          start_date,
          end_date,
          invoice_date: formattedDate,
          invoice_from_address,
          invoice_to_address,
          invoice_to_name,
          invoice_property_name,
          invoice_package_name,
          invoice_area,
          invoice_no: invoice_no_unq,
          //invoice_no,
          created_by,
          last_update_by: created_by,
          partner_builder_project_id: partner_builder_project_id || null,
          company_id,
          slab_level: slab_level,
          price_level: price_level,
        },
        { transaction }
      );

      await subscription.save({ transaction });
      if (!package_price && user_id) {
        const query = `
      SELECT unique_id as unique_id FROM
          user_type_mapping AS utm where utm.user_id = ${user_id}`;
        const custunique_id = await db.sequelize.query(query, {
          type: db.sequelize.QueryTypes.SELECT,
        });
        console.log("custunique_id", custunique_id);
        const cust_unique_id = custunique_id[0].unique_id;
        console.log("custunique_id_final", cust_unique_id);

        const email_message = `
                  User ID - ${cust_unique_id}
                  User Email - ${user.email}
                  User Mobile - ${user.mobile}
                  Property ID - ${property_no}
                  Property Name - ${property.property_name}
                  Property Area (in Sq. Yds.) - ${invoice_area}
                  Package Selected - ${package.package_name}`;
        const email_subject = "Request for Package quote";
        await sendEmailToSuperadmins(email_message, email_subject);
      }

      await transaction.commit();
      // if (package_price) {
      //   const paymentFormHtml = await processPayment(subscription.subscription_id, package_price);
      //   // console.log(paymentFormHtml);
      //   // return res.json({ paymentUrl });
      //   return res.send(paymentFormHtml)
      // }
      return res.status(201).json({
        message: "Property and subscription added successfully",
        property,
        subscription,
      });
    }

    await transaction.commit();
    return res
      .status(201)
      .json({ message: "Property added successfully", property });
  } catch (error) {
    console.error(error);
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};

exports.editProperty = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      user_id: request_user_id,
      user_type_mapping_id,
      user_type_category_id,
    } = req.user;
    const { property_id } = req.params;
    const {
      reference_code,
      property_name,
      package_price,
      package_name,
      package_id,
      description,
      address,
      town,
      mandal,
      city,
      state,
      country,
      pincode,
      area,
      lat,
      long,
      user_id,
      verification_status,
    } = req.body;

    const property = await Property.findByPk(property_id, { transaction });

    if (!property) {
      await transaction.rollback();
      return res.status(404).json({ error: "Property not found" });
    }

    let authenticPartnerBuilder = false;
    let addUserIdToSubscription =
      !property.user_id && user_type_category_id === 3;
    let updatedUserId = property.user_id;

    if (user_type_category_id === 5 && property.company_id) {
      const partnerBuilder = await db.PartnerBuilder.findOne(
        { where: { user_type_mapping_id } },
        { transaction }
      );
      authenticPartnerBuilder =
        partnerBuilder.company_id === property.company_id;
    }

    if (
      !(
        user_type_category_id === 1 ||
        user_type_category_id === 2 ||
        (user_type_category_id === 3 &&
          (reference_code === property.reference_code ||
            request_user_id === property.user_id)) ||
        (user_type_category_id === 5 && authenticPartnerBuilder)
      )
    ) {
      await transaction.rollback();
      throw new Error("You do not have permission to make this request.");
    }

    // if (addUserIdToSubscription) {
    //   console.log("addUserIdToSubscription=="+user_type_category_id)
    //   updatedUserId = updatedUserId || request_user_id;
    //   await Subscription.update({package_id:package_id,package_price:package_price}, { where: { property_id } }, { transaction });
    // }else{
    if (user_type_category_id === 3) {
      console.log("Custmer ID==" + user_type_category_id);
      console.log("package_price==" + package_price);
      console.log("package_id==" + package_id);
      let pkg_price = "";
      if (package_price !== "") {
        pkg_price = package_price;
        console.log("package_price if update==" + pkg_price);
      } else {
        pkg_price = null;
        console.log("package_price else update==" + pkg_price);
      }
      updatedUserId = updatedUserId || request_user_id;
      await Subscription.update(
        {
          user_id: updatedUserId,
          package_id: package_id,
          package_price: pkg_price,
        },
        { where: { property_id } },
        { transaction }
      );
    }
    if (user_type_category_id === 5) {
      console.log("Parner Bulider Id==" + user_type_category_id);
      let package = await Package.findByPk(package_id, { transaction });
      console.log("package Enter==" + package);
      if (!package && isNaN(package)) {
        throw Error("package_id is missing");
      } else if (!package || isNaN(package)) {
        const package_name = "Basic";
        const getpackage = await packageService.getPackageByName(package_name, {
          transaction,
        });
        const package_id = getpackage.package_id;
        console.log("package ID==" + package_id);
        // const package_price = await packageService.getPackagePriceByArea(
        //   package_id,
        //   area,
        //   { transaction }
        // );
        const package_price = await getpackage.package_price;
        console.log("package_price_Error===" + package_price);
        if (!package_price) {
          throw Error(
            "Please contact Bhuvi admin as the Area of the property is above the designated slab."
          );
        } else {
          console.log("package ID success==" + package_id);
          console.log("package_price success==" + package_price);
          updatedUserId = updatedUserId || request_user_id;
          await Subscription.update(
            { package_id: package_id, package_price: package_price },
            { where: { property_id } },
            { transaction }
          );
        }
      }
    }

    // }
    let prop_user_id;
    if (user_type_category_id === 3) {
      prop_user_id = property.user_id || updatedUserId || request_user_id;
      console.log("prop_user_id ==if====", prop_user_id);
    } else {
      prop_user_id = property.user_id;
      console.log("prop_user_id ==elseif====", prop_user_id);
    }
    const updatedFields = {
      //user_id: property.user_id,
      user_id: prop_user_id,
      property_name: property_name || property.property_name,
      description: description || property.description,
      area: area || property.area,
      lat: lat || property.lat,
      long: long || property.long,
      address: address || property.address,
      town: town || property.town,
      mandal: mandal || property.mandal,
      city: city || property.city,
      state: state || property.state,
      country: country || property.country,
      pincode: pincode || property.pincode,
      last_update_by: request_user_id,
      verification_status: verification_status,
    };

    await property.update(updatedFields, { transaction });

    const images = req.files && req.files["images"] ? req.files["images"] : [];
    const documents =
      req.files && req.files["documents"] ? req.files["documents"] : [];

    await handleUploadedFiles(
      images,
      "images",
      property.user_id || request_user_id,
      property
    );
    await handleUploadedFiles(
      documents,
      "documents",
      property.user_id || request_user_id,
      property
    );

    await property.save({ transaction });
    await transaction.commit();

    // let subscription;
    // subscription = await Subscription.create({
    // }, { transaction });
    // await Subscription.update({ user_id: updatedUserId }, { where: { property_id } }, { transaction });
    // //await subscription.save({ transaction });
    res
      .status(200)
      .json({ message: "Property updated successfully", property });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getPropertyDetails = async (req, res) => {
  try {
    const propertyId = req.params.property_id;
    const { user_type_category_id } = req.user;
    const admin_authorised =
      user_type_category_id === 1 || user_type_category_id === 2;

    const query = `
    SELECT
        p.property_id,
        p.property_name,
        p.description,
        p.area,
        p.address,
        p.town,
        p.mandal,
        p.city,
        p.state,
        p.country,
        p.pincode,
        p.prop_unique_id,
        p.images,
        p.documents,
        p.created_at,
        p.user_id,
        p.package_id,
        p.is_verified,
        p.assign_agent,
        p.document_verification,
        p.site_verification,
        p.lat,
        p.long,
        p.payment,
        p.reference_code,
        p.reference_code_expiry,
        p.company_id,
        p.partner_builder_project_id,
        pkg.package_id,
        pkg.package_name,
        ps.package_service_id,
        ps.package_service_price,
        s.service_id,
        s.service_name,
        t.task_id,
        t.status as task_status,
        t.agent_id as agent_id,
        t.agent_name as agent_name,
        t.property_id AS task_property_id,
        sub.package_price,
        sub.subscription_id,
        sub.start_date,
        sub.end_date,
        sub.status,
        sub.slab_level,
        sub.price_level,
        u.email AS user_email,
        u.mobile AS user_mobile
       
    FROM
        property AS p
    LEFT JOIN
        subscription AS sub ON p.property_id = sub.property_id
    LEFT JOIN
        package AS pkg ON sub.package_id = pkg.package_id
    LEFT JOIN
        package_service AS ps ON pkg.package_id = ps.package_id AND ps.is_active = 1
    LEFT JOIN
        service AS s ON ps.service_id = s.service_id AND s.is_active = 1
    LEFT JOIN
        task AS t ON ps.service_id = t.service_id AND p.property_id = t.property_id AND t.is_active = 1
    LEFT JOIN 
        user as u ON p.user_id = u.user_id
   
    WHERE
        p.property_id = :propertyId
    `;

    const propertyDetails = await db.sequelize.query(query, {
      replacements: { propertyId },
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (!propertyDetails || propertyDetails?.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    const propertyData = propertyDetails[0];
    // ensure images and documents are in proper json array format 2024-05-13
    //const images = propertyData.images.length ? JSON.parse(propertyData.images) : [];
    //const documents = propertyData.documents.length ? JSON.parse(propertyData.documents) : [];

    let images = await (propertyData?.images?.length
      ? JSON.parse(propertyData?.images)
      : []);
    let documents = await (propertyData?.documents?.length
      ? JSON.parse(propertyData?.documents)
      : []);
    if (typeof images === "string") {
      images = JSON.parse(images);
    }
    if (typeof documents === "string") {
      documents = JSON.parse(documents);
    }

    // const imageUrls = await Promise.all(
    //   images.map(async (image) => {
    //     const imageUrl = await getFileUrl(image);
    //     return imageUrl;
    //   })
    // );

    // const documentUrls = await Promise.all(
    //   documents.map(async (document) => {
    //     const documentUrl = await getFileUrl(document);
    //     return documentUrl;
    //   })
    // );

    const imageUrls = images?.map((image) => {
      // const imageUrl = await getFileUrl(image);
      const imageUrl = `${process.env.BACKEND_URL}/${image}`;
      return imageUrl;
    });
    const documentUrls = documents?.map((document) => {
      // const documentUrl = await getFileUrl(document);
      const documentUrl = `${process.env.BACKEND_URL}/${document}`;
      return documentUrl;
    });
    const packageData = {
      package_id: propertyData.package_id,
      package_name: propertyData.package_name,
      package_price: propertyData.package_price,
      services: propertyDetails.map((row) => ({
        service_id: row.service_id,
        service_name: row.service_name,
        package_service_price: row.package_service_price,
        service_status: row.task_status,
        agent_id: row.agent_id,
        agent_name: row.agent_name,
        task_property_id: row.task_property_id,
        task_id: row.task_id,
      })),
    };

    const subscriptionData = {
      subscription_id: propertyData.subscription_id,
      status: propertyData.status,
      start_date: propertyData.start_date,
      end_date: propertyData.end_date,
      slab_level: propertyData.slab_level,
      price_level: propertyData.price_level,
    };

    const propertyDetailsWithUrls = {
      property_id: propertyData.property_id,
      property_name: propertyData.property_name,
      description: propertyData.description,
      area: propertyData.area,
      address: propertyData.address,
      town: propertyData.town,
      mandal: propertyData.mandal,
      payment: propertyData.payment,
      city: propertyData.city,
      state: propertyData.state,
      country: propertyData.country,
      pincode: propertyData.pincode,
      prop_unique_id: propertyData.prop_unique_id,
      user_unique_id: propertyData.user_unique_id,
      images: images,
      imagesUrls: imageUrls,
      documents: documents,
      documentsUrls: documentUrls,
      created_at: propertyData.created_at,
      user_id: propertyData.user_id,
      is_verified: propertyData.is_verified,
      company_id: propertyData.company_id,
      partner_builder_project_id: propertyData.partner_builder_project_id,
      package: packageData,
      subscription: subscriptionData,
      assign_agent: propertyData.assign_agent,
      document_verification: propertyData.document_verification,
      site_verification: propertyData.site_verification,
      lat: propertyData.lat,
      long: propertyData.long,
      user_email: user_type_category_id === 5 ? null : propertyData.user_email,
      user_mobile:
        user_type_category_id === 5 ? null : propertyData.user_mobile,
      reference_code: propertyData.reference_code,
      reference_code_expiry: propertyData.reference_code_expiry,
    };

    res.status(200).json({ property: propertyDetailsWithUrls });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to fetch property details' });
    res.status(500).json({ message: error.message });
  }
};

exports.addInvoice = async (req, res) => {
  try {
    const { subscription_id } = req.body;

    const subscription = await Subscription.findByPk(subscription_id);

    const invoices = req.files["invoices"] || [];
    await handleUploadedFiles(
      invoices,
      "invoices",
      subscription.user_id,
      subscription
    );

    await subscription.save();

    res
      .status(201)
      .json({ message: "Invoice saved successfully", subscription });
  } catch (error) {
    console.error(error);
    //   res.status(500).json({ error: 'Failed to save invoice' });
    res.status(500).json({ message: error.message });
  }
};

exports.verifyProperty = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { property_id } = req.params;
    const { document_verification, site_verification, lat, long, otp } =
      req.body;

    // Validate OTP
    const adminUser = await db.User.findByPk(user_id);
    const email_otp = adminUser.email_otp;

    if (parseInt(otp) !== parseInt(email_otp)) {
      return res.status(401).json({ error: "Incorrect OTP" });
    }

    const property = await Property.findByPk(property_id, {
      include: [
        {
          model: db.User,
          attributes: ["email", "first_name", "last_name"],
        },
      ],
    });

    if (!property.user_id) {
      throw new Error(
        "This property has no customer attached to it. Please attach a customer first."
      );
    }

    const subscription = await Subscription.findOne({ where: { property_id } });

    const is_verified = document_verification && site_verification ? 1 : 0;

    if (is_verified) {
      const customer = property.user;
      const customer_email = customer.email;
      const customer_name = customer.first_name + " " + customer.last_name;
      const property_name = property.property_name;
      const email_message = `Hi ${customer_name},

            Your property ${property_name} has been verified successfully.
            
            Regards,
            Bhuvi Realtech`;

      await sendEmail(
        customer_email,
        email_message,
        `${property_name} Verified`
      );
    }

    const assign_agent =
      is_verified && subscription.status === "Active" ? 1 : 0;

    // await property.save();

    if (assign_agent && !subscription.tasks_created) {
      // TODO: move this to inside create task function
      start_date = db.sequelize.literal("CURRENT_TIMESTAMP");
      end_date = db.sequelize.literal(
        "DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR)"
      );
      await subscription.update({
        start_date,
        end_date,
        last_update_by: user_id,
        updated_at: db.sequelize.literal("CURRENT_TIMESTAMP"),
      });
      await createTasks(subscription.subscription_id);
      // await createTasks(subscription);
    }

    const updated_property = await property.update({
      // lat: lat || property.lat,
      lat,
      // long: long || property.long,
      long,
      document_verification,
      site_verification,
      assign_agent,
      is_verified,
      updated_at: db.sequelize.literal("CURRENT_TIMESTAMP"),
      last_update_by: user_id,
    });

    res.status(200).json({
      message: "Property Verified successfully",
      property: updated_property,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getPropertyByReferenceCode = async (req, res) => {
  try {
    const { reference_code, property_id } = req.body;
    const query = `
    SELECT
        p.property_id,
        p.property_name,
        p.description,
        p.area,
        p.address,
        p.town,
        p.mandal,
        p.city,
        p.state,
        p.country,
        p.pincode,
        p.payment,
        p.images,
        p.documents,
        p.lat,
        p.long,
        pkg.package_id,
        pkg.package_name,
        ps.package_service_id,
        ps.package_service_price,
        sub.package_price,
        s.service_id,
        s.service_name
    FROM
        property AS p
    LEFT JOIN
        subscription AS sub ON p.property_id = sub.property_id
    LEFT JOIN
        package AS pkg ON sub.package_id = pkg.package_id
    LEFT JOIN
        package_service AS ps ON pkg.package_id = ps.package_id AND ps.is_active = 1
    LEFT JOIN
        service AS s ON ps.service_id = s.service_id AND s.is_active = 1
    LEFT JOIN 
        user as u ON p.user_id = u.user_id
    WHERE
        p.property_id = :property_id AND p.reference_code = :reference_code
    `;
    // AND p.user_id is NULL
    const propertyDetails = await db.sequelize.query(query, {
      replacements: { property_id, reference_code },
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (!propertyDetails || propertyDetails?.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    const propertyData = propertyDetails[0];
    // ensure images and documents are in proper json array format 2024-05-13
    //const images = propertyData.images.length ? JSON.parse(propertyData.images) : [];
    //const documents = propertyData.documents.length ? JSON.parse(propertyData.documents) : [];

    let images = await (propertyData?.images?.length
      ? JSON.parse(propertyData.images)
      : []);
    let documents = await (propertyData?.documents.length
      ? JSON.parse(propertyData.documents)
      : []);
    if (typeof images === "string") {
      images = JSON.parse(images);
    }
    if (typeof documents === "string") {
      documents = JSON.parse(documents);
    }

    const imageUrls = await Promise.all(
      images.map(async (image) => {
        const imageUrl = await getFileUrl(image);
        return imageUrl;
      })
    );

    const documentUrls = await Promise.all(
      documents.map(async (document) => {
        const documentUrl = await getFileUrl(document);
        return documentUrl;
      })
    );

    const packageData = {
      package_id: propertyData.package_id,
      package_name: propertyData.package_name,
      package_price: propertyData.package_price,
      services: propertyDetails.map((row) => ({
        service_id: row.service_id,
        service_name: row.service_name,
        package_service_price: row.package_service_price,
        service_status: row.status,
        task_property_id: row.task_property_id,
        task_id: row.task_id,
      })),
    };

    const propertyDetailsWithUrls = {
      property_id: propertyData.property_id,
      property_name: propertyData.property_name,
      description: propertyData.description,
      area: propertyData.area,
      address: propertyData.address,
      town: propertyData.town,
      mandal: propertyData.mandal,
      city: propertyData.city,
      state: propertyData.state,
      country: propertyData.country,
      pincode: propertyData.pincode,
      payment: propertyData.payment,
      images: images,
      imagesUrls: imageUrls,
      documents: documents,
      documentsUrls: documentUrls,
      package: packageData,
      lat: propertyData.lat,
      long: propertyData.long,
      package_price: propertyData.package_price,
    };

    res.status(200).json({ property: propertyDetailsWithUrls });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
  exports.getValidatePackageDetails = async (req, res) => {
    try {
      const propertyId = req.params.property_id;
      const { user_type_category_id } = req.user;
      const admin_authorised =
        user_type_category_id === 1 || user_type_category_id === 2;

      const query = `
      SELECT
          p.property_id,
          p.property_name,
          p.description,
          p.area,
          p.address,
          p.town,
          p.mandal,
          p.city,
          p.state,
          p.country,
          p.pincode,
          p.prop_unique_id,
          p.images,
          p.documents,
          p.created_at,
          p.user_id,
          p.is_verified,
          p.assign_agent,
          p.document_verification,
          p.site_verification,
          p.lat,
          p.long,
          p.payment,
          p.reference_code,
          p.reference_code_expiry,
          pkg.package_id,
          pkg.package_name,
          ps.package_service_id,
          ps.package_service_price,
          s.service_id,
          s.service_name,
          t.task_id,
          t.status as task_status,
          t.agent_id as agent_id,
          t.agent_name as agent_name,
          t.property_id AS task_property_id,
          sub.package_price,
          sub.subscription_id,
          sub.start_date,
          sub.end_date,
          sub.status,
          sub.slab_level,
          sub.price_level,
          u.email AS user_email,
          u.mobile AS user_mobile
      FROM
          property AS p
      LEFT JOIN
          subscription AS sub ON p.property_id = sub.property_id
      LEFT JOIN
          package AS pkg ON sub.package_id = pkg.package_id
      LEFT JOIN
          package_service AS ps ON pkg.package_id = ps.package_id AND ps.is_active = 1
      LEFT JOIN
          service AS s ON ps.service_id = s.service_id AND s.is_active = 1
      LEFT JOIN
          task AS t ON ps.service_id = t.service_id AND p.property_id = t.property_id AND t.is_active = 1
      LEFT JOIN 
          user as u ON p.user_id = u.user_id
      WHERE
          p.property_id = :propertyId
      `;

      const propertyDetails = await db.sequelize.query(query, {
        replacements: { propertyId },
        type: db.sequelize.QueryTypes.SELECT,
      });

      if (!propertyDetails || propertyDetails.length === 0) {
        return res.status(404).json({ error: "Property not found" });
      }

      const propertyData = propertyDetails[0];
      // ensure images and documents are in proper json array format 2024-05-13
      //const images = propertyData.images.length ? JSON.parse(propertyData.images) : [];
      //const documents = propertyData.documents.length ? JSON.parse(propertyData.documents) : [];

      let images = await (propertyData.images.length
        ? JSON.parse(propertyData.images)
        : []);
      let documents = await (propertyData.documents.length
        ? JSON.parse(propertyData.documents)
        : []);
      if (typeof images === "string") {
        images = JSON.parse(images);
      }
      if (typeof documents === "string") {
        documents = JSON.parse(documents);
      }

      const imageUrls = await Promise.all(
        images.map(async (image) => {
          const imageUrl = await getFileUrl(image);
          return imageUrl;
        })
      );

      const documentUrls = await Promise.all(
        documents.map(async (document) => {
          const documentUrl = await getFileUrl(document);
          return documentUrl;
        })
      );

      const packageData = {
        package_id: propertyData.package_id,
        package_name: propertyData.package_name,
        package_price: propertyData.package_price,
        services: propertyDetails.map((row) => ({
          service_id: row.service_id,
          service_name: row.service_name,
          package_service_price: row.package_service_price,
          service_status: row.task_status,
          agent_id: row.agent_id,
          agent_name: row.agent_name,
          task_property_id: row.task_property_id,
          task_id: row.task_id,
        })),
      };

      const subscriptionData = {
        subscription_id: propertyData.subscription_id,
        status: propertyData.status,
        start_date: propertyData.start_date,
        end_date: propertyData.end_date,
        slab_level: propertyData.slab_level,
        price_level: propertyData.price_level,
      };

      const propertyDetailsWithUrls = {
        property_id: propertyData.property_id,
        property_name: propertyData.property_name,
        description: propertyData.description,
        area: propertyData.area,
        address: propertyData.address,
        town: propertyData.town,
        mandal: propertyData.mandal,
        payment: propertyData.payment,
        city: propertyData.city,
        state: propertyData.state,
        country: propertyData.country,
        pincode: propertyData.pincode,
        prop_unique_id: propertyData.prop_unique_id,
        images: images,
        imagesUrls: imageUrls,
        documents: documents,
        documentsUrls: documentUrls,
        created_at: propertyData.created_at,
        user_id: propertyData.user_id,
        is_verified: propertyData.is_verified,
        package: packageData,
        subscription: subscriptionData,
        assign_agent: propertyData.assign_agent,
        document_verification: propertyData.document_verification,
        site_verification: propertyData.site_verification,
        lat: propertyData.lat,
        long: propertyData.long,
        user_email:
          user_type_category_id === 5 ? null : propertyData.user_email,
        user_mobile:
          user_type_category_id === 5 ? null : propertyData.user_mobile,
        reference_code: propertyData.reference_code,
        reference_code_expiry: propertyData.reference_code_expiry,
      };

      res.status(200).json({ property: propertyDetailsWithUrls });
    } catch (error) {
      console.error(error);
      // res.status(500).json({ error: 'Failed to fetch property details' });
      res.status(500).json({ message: error.message });
    }
  };
};

exports.getBulkProperties = async (req, res) => {
  try {
    const { project_unique_id } = req.body;
    const failedRecords = [];
    const validRecords = [];
    const insertedRecords = [];

    const expectedHeaders = [
      "property_name",
      "description",
      "area",
      "address",
      "town",
      "mandal",
      "city",
      "state",
      "country",
      "pincode",
    ];

    let headersVerified = false;
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("headers", (headers) => {
          headersVerified = expectedHeaders.every((header) =>
            headers.includes(header)
          );
          if (!headersVerified) {
            reject(new Error("CSV headers do not match expected format."));
          }
        })
        .on("data", (data) => {
          const isValid = expectedHeaders.every(
            (field) => data[field] && data[field].trim() !== ""
          );
          if (!isValid) {
            failedRecords.push(data);
          } else {
            validRecords.push(data);
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    if (!req.user || !req.user.user_id) {
      throw new Error("User information is missing.");
    }

    const { user_id } = req.user;

    const findProjectQuery = `SELECT * FROM partner_builder_project WHERE project_unique_id = ?`;
    const project = await sequelize.query(findProjectQuery, {
      type: sequelize.QueryTypes.SELECT,
      replacements: [project_unique_id],
      raw: true,
    });

    const projectData = project[0];
    if (!projectData) {
      throw new Error("Invalid project_unique_id. No matching project found.");
    }

    const insertQuery = `
      INSERT INTO property (
        property_name, description, area, address, town, mandal, city, state, country, pincode,
        partner_builder_project_id, company_id, payment, created_by, last_update_by,
        state_code, city_code, prop_unique_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const record of validRecords) {
      const t = await sequelize.transaction();
      try {
        const pincodeQuery = `SELECT * FROM pincode WHERE state = ? AND city = ?`;
        const pincode = await sequelize.query(pincodeQuery, {
          type: sequelize.QueryTypes.SELECT,
          replacements: [record.state, record.city],
          transaction: t,
          raw: true,
        });

        const pincodeData = pincode[0];
        if (!pincodeData) {
          throw new Error("Invalid state and country for pincode lookup.");
        }

        const randomNumber = Math.floor(Math.random() * 10000000);
        const prop_unique_id = `${pincodeData.city_code}PB_BU${randomNumber}`;

        const replacements = [
          record.property_name,
          record.description,
          record.area,
          record.address,
          record.town,
          record.mandal,
          record.city,
          record.state,
          record.country,
          record.pincode,
          projectData.partner_builder_project_id,
          projectData.company_id,
          projectData.payment,
          user_id,
          user_id,
          pincodeData.state_code,
          pincodeData.city_code,
          prop_unique_id,
        ];

        await sequelize.query(insertQuery, {
          type: sequelize.QueryTypes.INSERT,
          replacements,
          transaction: t,
          raw: true,
        });

        await t.commit();
        insertedRecords.push(record);
      } catch (err) {
        console.error("Insert error:", err.message);
        await t.rollback();
        failedRecords.push(record);
      }
    }

    fs.unlinkSync(req.file.path);
    const data = failedRecords.length > 0 ? failedRecords : insertedRecords;
    res.json({ message: "Upload complete", failedRecords, insertedRecords });
  } catch (error) {
    console.error("Bulk upload failed:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

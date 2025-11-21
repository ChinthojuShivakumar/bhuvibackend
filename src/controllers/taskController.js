// src/controllers/taskController.js
const {
  Task,
  Subscription,
  Package,
  Property,
  User,
  UserType,
} = require("../models");
const db = require("../models");
const { handleUploadedFiles, getFileUrl } = require("../utils/utils");
const { handleUploadedFilesImages } = require("../utils/utils");
// const { createTasks } = require('../services/taskService');
// const { Op } = require('sequelize');
const { getUserById } = require("../services/userService");
const { senderEmail } = require("../config/smtpConfig");
const { sendEmail } = require("../services/emailService");
const { sendEmailforsrtView } = require("../services/emailService");
const { isValidDate, isValidStatus } = require("../services/taskService");

exports.getTasks = async (req, res) => {
  try {
    const user = req.user;
    let {
      page,
      limit,
      assigned_start_date,
      assigned_end_date,
      status,
      status_not,
      property_id,
    } = req.query;
    // console.error(user)

    let tasks;

    if (user.user_type_category_id === 1 || user.user_type_category_id === 2) {
      console.log("user_type_category_id====" + user.user_type_category_id);
      const query = `
                SELECT 
                    t.*, pr.property_name, pr.description, pr.area, pr.lat, pr.long, pr.address, 
                    pr.mandal, pr.town, pr.city, pr.state, pr.country, pr.pincode,pr.prop_unique_id,
                    pack.package_name, u.email, u.first_name, u.last_name,u.mobile, utm.user_type_id, 
                    utm.unique_id, ut.user_type_name, utc.user_type_category_name, 
                    utc.user_type_category_id
                FROM 
                    task AS t
                LEFT JOIN 
                    property AS pr ON t.property_id = pr.property_id
                LEFT JOIN 
                    package AS pack ON t.package_id = pack.package_id
                LEFT JOIN 
                    user AS u ON t.user_id = u.user_id
                LEFT JOIN 
                    user_type_mapping AS utm ON u.user_id = utm.user_id AND utm.user_type_id = 3
                LEFT JOIN 
                    user_type AS ut ON utm.user_type_id = ut.user_type_id
                LEFT JOIN 
                    user_type_category AS utc ON ut.user_type_category_id = utc.user_type_category_id;
            `;
      results = await db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.SELECT,
      });
      // console.log("results===="+results)
      tasks = results.map((result) => ({
        task_id: result.task_id,
        package_id: result.package_id,
        service_id: result.service_id,
        service_name: result.service_name,
        subscription_id: result.subscription_id,
        property_id: result.property_id,
        user_id: result.user_id,
        unique_id: result.unique_id,
        prop_unique_id: result.prop_unique_id,
        agent_id: result.agent_id,
        agent_user_type_id: result.agent_user_type_id,
        agent_name: result.agent_name,
        agent_email: result.agent_email,
        agent_mobile: result.agent_mobile,
        assigned_date: result.assigned_date,
        assigned_start_date: result.assigned_start_date,
        assigned_end_date: result.assigned_end_date,
        start_date: result.start_date,
        end_date: result.end_date,
        is_active: result.is_active,
        status: result.status,
        documents: result.documents,
        images: result.images,
        previous_images: result.previous_images
          ? JSON.parse(result.previous_images)
          : [],
        previous_documents: result.previous_documents
          ? JSON.parse(result.previous_documents)
          : [],
        // geo_fencing: result.geo_fencing ? JSON.parse(result.geo_fencing) : [],
        geo_fencing: result.geo_fencing,
        chat: result.chat,
        // geo_tagging: result.geo_tagging ? JSON.parse(result.geo_tagging) : [],
        geo_tagging: result.geo_tagging,
        // previous_geo_tagging: result.previous_geo_tagging ? JSON.parse(result.previous_geo_tagging) : [],
        previous_geo_tagging: result.previous_geo_tagging,
        agent_assigned_by: result.agent_assigned_by,
        last_update_by: result.last_update_by,
        created_at: result.created_at,
        updated_at: result.updated_at,
        user: {
          email: result.email,
          first_name: result.first_name,
          last_name: result.last_name,
          user_type_id: result.user_type_id,
          user_type: {
            user_type_name: result.user_type_name,
            user_type_id: result.user_type_id,
          },
        },
        package: {
          package_name: result.package_name,
        },
        property: {
          property_name: result.property_name,
          description: result.description,
          area: result.area,
          lat: result.lat,
          long: result.long,
          address: result.address,
          mandal: result.mandal,
          town: result.town,
          city: result.city,
          state: result.state,
          country: result.country,
          pincode: result.pincode,
        },
        user_type_category: {
          user_type_category_name: result.user_type_category_name,
          user_type_category_id: result.user_type_category_id,
        },
      }));
    } else if (user.user_type_category_id === 3) {
      console.log("user_type_category_id====" + user.user_type_category_id);
      const query = `
                SELECT 
                    t.*, pr.property_name, pack.package_name
                FROM 
                    task AS t
                LEFT JOIN 
                    property AS pr ON t.property_id = pr.property_id
                LEFT JOIN 
                    package AS pack ON t.package_id = pack.package_id
                WHERE 
                    t.user_id = ${user.user_id};
            `;
      results = await db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.SELECT,
      });
      tasks = results.map((result) => ({
        task_id: result.task_id,
        package_id: result.package_id,
        service_id: result.service_id,
        service_name: result.service_name,

        subscription_id: result.subscription_id,
        property_id: result.property_id,
        user_id: result.user_id,
        agent_id: result.agent_id,
        agent_user_type_id: result.agent_user_type_id,
        agent_name: result.agent_name,
        agent_email: result.agent_email,
        agent_mobile: result.agent_mobile,
        assigned_date: result.assigned_date,
        assigned_start_date: result.assigned_start_date,
        assigned_end_date: result.assigned_end_date,
        start_date: result.start_date,
        end_date: result.end_date,
        is_active: result.is_active,
        status: result.status,
        documents: result.documents,
        images: result.images,
        previous_images: result.previous_images
          ? JSON.parse(result.previous_images)
          : [],
        previous_documents: result.previous_documents
          ? JSON.parse(result.previous_documents)
          : [],
        // geo_fencing: result.geo_fencing ? JSON.parse(result.geo_fencing) : [],
        geo_fencing: result.geo_fencing,
        chat: result.chat,
        // geo_tagging: result.geo_tagging ? JSON.parse(result.geo_tagging) : [],
        geo_tagging: result.geo_tagging,
        // previous_geo_tagging: result.previous_geo_tagging ? JSON.parse(result.previous_geo_tagging) : [],
        previous_geo_tagging: result.previous_geo_tagging,
        agent_assigned_by: result.agent_assigned_by,
        last_update_by: result.last_update_by,
        created_at: result.created_at,
        updated_at: result.updated_at,
        package: {
          package_name: result.package_name,
        },
        property: {
          property_name: result.property_name,
        },
      }));
    } else if (user.user_type_category_id === 4) {
      page = parseInt(page);
      limit = parseInt(limit);
      let pagination = ``;
      if (page && limit) {
        const offset = (page - 1) * limit;
        pagination = `LIMIT 
                    ${limit} 
                OFFSET 
                    ${offset}`;
      }

      let where = `t.agent_id = ${user.user_id}`;
      if (property_id) {
        where += ` AND t.property_id = ${property_id}`;
      }
      if (assigned_start_date && isValidDate(assigned_start_date)) {
        where += ` AND t.assigned_start_date >= "${assigned_start_date}"`;
      }
      if (assigned_end_date && isValidDate(assigned_end_date)) {
        where += ` AND t.assigned_end_date <= "${assigned_end_date}"`;
      }
      if (status && isValidStatus(status)) {
        where += ` AND t.status = "${status}"`;
      } else if (status_not && isValidStatus(status_not)) {
        where += ` AND t.status != "${status_not}"`;
      }
      const query = `
                SELECT 
                    t.*, pr.property_name, pr.description, pr.area, pr.lat, pr.long, pr.address, 
                    pr.mandal, pr.town, pr.city, pr.state, pr.country, pr.pincode, 
                    pr.images AS property_images, pack.package_name,
                    (SELECT COUNT(*)
                    FROM task AS t
                    LEFT JOIN property AS pr ON t.property_id = pr.property_id
                    LEFT JOIN package AS pack ON t.package_id = pack.package_id
                    WHERE ${where}) AS total_count
                FROM 
                    task AS t
                LEFT JOIN 
                    property AS pr ON t.property_id = pr.property_id
                LEFT JOIN 
                    package AS pack ON t.package_id = pack.package_id
                WHERE 
                    ${where}
                ORDER BY t.property_id DESC
                ${pagination};
            `;
      results = await db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.SELECT,
      });
      tasks = results.map((result) => ({
        total_count: result.total_count,
        task_id: result.task_id,
        package_id: result.package_id,
        service_id: result.service_id,
        service_name: result.service_name,
        subscription_id: result.subscription_id,
        property_id: result.property_id,
        user_id: result.user_id,
        agent_id: result.agent_id,
        agent_user_type_id: result.agent_user_type_id,
        agent_name: result.agent_name,
        agent_email: result.agent_email,
        agent_mobile: result.agent_mobile,
        assigned_date: result.assigned_date,
        assigned_start_date: result.assigned_start_date,
        assigned_end_date: result.assigned_end_date,
        start_date: result.start_date,
        end_date: result.end_date,
        is_active: result.is_active,
        status: result.status,
        documents: result.documents,
        images: result.images,
        previous_images: result.previous_images
          ? JSON.parse(result.previous_images)
          : [],
        previous_documents: result.previous_documents
          ? JSON.parse(result.previous_documents)
          : [],
        // geo_fencing: result.geo_fencing ? JSON.parse(result.geo_fencing) : [],
        geo_fencing: result.geo_fencing,
        chat: result.chat,
        // geo_tagging: result.geo_tagging ? JSON.parse(result.geo_tagging) : [],
        geo_tagging: result.geo_tagging,
        // previous_geo_tagging: result.previous_geo_tagging ? JSON.parse(result.previous_geo_tagging) : [],
        previous_geo_tagging: result.previous_geo_tagging,
        agent_assigned_by: result.agent_assigned_by,
        last_update_by: result.last_update_by,
        created_at: result.created_at,
        updated_at: result.updated_at,
        package: {
          package_name: result.package_name,
        },
        property: {
          property_name: result.property_name,
          description: result.description,
          area: result.area,
          lat: result.lat,
          long: result.long,
          address: result.address,
          mandal: result.mandal,
          town: result.town,
          city: result.city,
          state: result.state,
          country: result.country,
          pincode: result.pincode,
          images:
            result.property_images && result.property_images.length
              ? JSON.parse(result.property_images)
              : [],
        },
      }));
    }

    res.status(200).json({ tasks });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to fetch tasks' });
    res.status(500).json({ messsage: error.messsage });
  }
};

exports.editTask = async (req, res) => {
  try {
    const taskId = req.params.task_id;
    const user = req.user;

    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: User,
          attributes: ["email", "first_name", "last_name", "mobile"],
        },
        {
          model: Property,
          attributes: ["property_name"],
        },
      ],
    });

    const customer = task.user;
    const customer_email = customer.email;
    const customer_name = customer.first_name + " " + customer.last_name;
    const property_name = task.property.property_name;

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (user.user_type_category_id === 5 || user.user_type_category_id === 6) {
      throw new Error(
        "You are not authorised to make the following change. Please contact the Admin."
      );
    }

    if (
      user.user_type_category_id === 1 ||
      user.user_type_category_id === 2 ||
      user.user_type_category_id === 4
    ) {
      const { status } = req.body;

      if (
        user.user_type_category_id === 1 ||
        user.user_type_category_id === 2
      ) {
        // Update agent_assigned_by for user types 1 and 2
        const {
          agent_id,
          agent_user_type_id,
          assigned_start_date,
          assigned_end_date,
          agent_email,
          agent_mobile,
        } = req.body;

        if (agent_id) {
          const agent = await getUserById(parseInt(agent_id));
          task.agent_assigned_by = user.user_id;
          task.agent_id = agent_id;
          task.agent_user_type_id = agent_user_type_id;
          task.agent_name = agent.first_name + " " + agent.last_name;
          task.agent_email = agent_email;
          task.agent_mobile = agent_mobile;
          task.assigned_date =
            task.assigned_date || db.sequelize.literal("CURRENT_TIMESTAMP");
          task.assigned_start_date = assigned_start_date;
          task.assigned_end_date = assigned_end_date;
        }
      } else if (
        task.status === "Completed" &&
        user.user_type_category_id === 4
      ) {
        throw new Error(
          "You are not authorised to edit a Completed task. Please contact the Admin."
        );
      }

      if (
        (status === "Ongoing" || status === "Completed") &&
        task.status === "Pending"
      ) {
        // Update start_date if status changes from 'Pending' to 'Ongoing' or 'Completed'
        task.start_date = db.sequelize.literal("CURRENT_TIMESTAMP");

        const email_message = `Hi ${customer_name},

                    ${task.service_name} service for ${property_name} has started.
                    
                    Regards,
                    Bhuvi Realtech`;

        await sendEmail(
          customer_email,
          email_message,
          `${task.service_name} Started`
        );
      }
      if (
        status === "Completed" &&
        (task.status === "Ongoing" || task.status === "Pending")
      ) {
        // Update start_date if status changes from 'Pending' or 'Ongoing' to 'Completed'
        task.end_date = db.sequelize.literal("CURRENT_TIMESTAMP");

        const email_message = `Hi ${customer_name},

                    ${task.service_name} service for ${property_name} has been completed.
                    
                    Regards,
                    Bhuvi Realtech`;

        await sendEmail(
          customer_email,
          email_message,
          `${task.service_name} Completed`
        );
      }

      task.status = status || task.status;

      const {
        geo_fencing,
        geo_tagging,
        previous_images,
        previous_geo_tagging,
        chat,
        previous_documents,
      } = req.body;

      if (geo_fencing && status === "Completed") {
        // const parsed_geo_fencing = [{"latitude": "17.1455", "longitude": "78.43649"}, {"latitude": "17.14561", "longitude": "78.4365"}, {"latitude": "17.14563", "longitude": "78.43638"}, {"latitude": "17.14551", "longitude": "78.43634"}];
        const parsed_geo_fencing = JSON.parse(geo_fencing);
        let geo_fencing_coordinates = "";
        for (let coordinates of parsed_geo_fencing) {
          geo_fencing_coordinates += `|${coordinates["latitude"]},${coordinates["longitude"]}`;
        }
        const geo_fencing_lat = parsed_geo_fencing[0]["latitude"];
        const geo_fencing_long = parsed_geo_fencing[0]["longitude"];
        geo_fencing_coordinates += `|${geo_fencing_lat},${geo_fencing_long}`;
        const path = `color:0xff0000ff|weight:5|fillcolor:0xFFFF0033${geo_fencing_coordinates}&maptype=hybrid`;

        // for 20% Zoom == 20m
        var streetViewUr20m = `https://maps.googleapis.com/maps/api/staticmap?size=400x400&location=${geo_fencing_lat},${geo_fencing_long}&zoom=20&center=${geo_fencing_lat},${geo_fencing_long}&path=${path}&key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg`;
        // for 19% Zoom ==  50 m
        var streetViewUr50m = `https://maps.googleapis.com/maps/api/staticmap?size=400x400&location=${geo_fencing_lat},${geo_fencing_long}&zoom=19&center=${geo_fencing_lat},${geo_fencing_long}&path=${path}&key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg`;
        // for 18 % Zoom ===100 m
        var streetViewUrl100m = `https://maps.googleapis.com/maps/api/staticmap?size=400x400&location=${geo_fencing_lat},${geo_fencing_long}&zoom=18&center=${geo_fencing_lat},${geo_fencing_long}&path=${path}&key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg`;
        // for 17 % Zoom ===200 m
        var streetViewUrl200m = `https://maps.googleapis.com/maps/api/staticmap?size=400x400&location=${geo_fencing_lat},${geo_fencing_long}&zoom=17&center=${geo_fencing_lat},${geo_fencing_long}&path=${path}&key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg`;

        const email_message = `Hi ${customer_name},\n

                ${task.service_name} service for ${property_name} has been completed.\n Please find the attached images for your reference (20 m,50 m,100 m,200 m).
                
                Regards,
                Bhuvi Realtech`;

        await sendEmailforsrtView(
          customer_email,
          email_message,
          "GeoFencing Completed",
          streetViewUr20m,
          streetViewUr50m,
          streetViewUrl100m,
          streetViewUrl200m
        );
      }
      task.geo_fencing = geo_fencing
        ? JSON.parse(geo_fencing)
        : task.geo_fencing;
      task.chat = chat ? JSON.parse(chat) : task.chat;

      if (geo_tagging && geo_tagging !== "[]") {
        task.geo_tagging = JSON.parse(geo_tagging);
      }
      const images =
        req.files && req.files["images"] ? req.files["images"] : [];
      const documents =
        req.files && req.files["documents"] ? req.files["documents"] : [];
      if (
        images !== "[]" &&
        images.length &&
        geo_tagging &&
        geo_tagging !== "[]"
      ) {
        const parsed_geo_tagging = JSON.parse(geo_tagging);
        if (images.length !== parsed_geo_tagging.length) {
          throw new Error("Can not update images without Geo Location.");
        }
      }
      // const append_documents = task.documents ? true : false;
      // Handle uploaded images and documents
      //await handleUploadedFiles(images, 'task_images', task.user_id, task);
      await handleUploadedFilesImages(
        images,
        "task_images",
        task.user_id,
        task
      );
      // await handleUploadedFiles(documents, 'task_documents', task.user_id, task, append_documents);
      await handleUploadedFiles(
        documents,
        "task_documents",
        task.user_id,
        task
      );
      // Code to handle deletion of images and geo_tagging
      const task_previous_images = previous_images
        ? JSON.parse(previous_images)
        : [];
      const task_current_images = task.images ? JSON.parse(task.images) : [];
      const task_previous_geo_tagging = previous_geo_tagging
        ? JSON.parse(previous_geo_tagging)
        : [];
      const task_current_geo_tagging = task.geo_tagging ? task.geo_tagging : [];
      const task_previous_documents = previous_documents
        ? JSON.parse(previous_documents)
        : [];
      const task_current_documents = task.documents
        ? JSON.parse(task.documents)
        : [];
      if (previous_images || task.images) {
        task.previous_images = JSON.stringify([
          ...task_previous_images,
          ...task_current_images,
        ]);
        task.previous_geo_tagging = [
          ...task_previous_geo_tagging,
          ...task_current_geo_tagging,
        ];
      } else {
        task.previous_images = null;
        task.previous_geo_tagging = null;
      }
      task.images = null;
      task.geo_tagging = null;
      if (previous_documents || task.documents) {
        task.previous_documents = JSON.stringify([
          ...task_previous_documents,
          ...task_current_documents,
        ]);
      } else {
        task.previous_documents = null;
      }
      task.documents = null;
    } else if (user.user_type_category_id === 3) {
      const { chat } = req.body;
      task.chat = chat ? JSON.parse(chat) : task.chat || null;
    }

    await task.save();

    res.status(200).json({ task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const { task_id } = req.params;

    const task = await Task.findByPk(task_id, {
      include: [
        { model: Package, attributes: ["package_name"] },
        {
          model: Property,
          attributes: [
            "property_name",
            "description",
            "area",
            "lat",
            "long",
            "address",
            "mandal",
            "town",
            "city",
            "state",
            "country",
            "pincode",
            "images",
          ],
        },
      ],
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Convert JSON strings to arrays
    task.property.images =
      task.property.images && task.property.images.length
        ? JSON.parse(task.property.images)
        : [];
    task.images = task.images ? JSON.parse(task.images) : [];
    task.previous_images =
      task.previous_images && task.previous_images.length
        ? JSON.parse(task.previous_images)
        : [];
    task.previous_documents =
      task.previous_documents && task.previous_documents.length
        ? JSON.parse(task.previous_documents)
        : [];
    task.documents = task.documents ? JSON.parse(task.documents) : [];

    // ensure images and documents are in proper json array format 2024-05-13
    if (typeof task.property.images === "string") {
      task.property.images = JSON.parse(task.property.images);
    }
    if (typeof task.images === "string") {
      task.images = JSON.parse(task.images);
    }
    if (typeof task.previous_images === "string") {
      task.previous_images = JSON.parse(task.previous_images);
    }
    if (typeof task.previous_documents === "string") {
      task.previous_documents = JSON.parse(task.previous_documents);
    }
    if (typeof task.documents === "string") {
      task.documents = JSON.parse(task.documents);
    }

    // Get file URLs for property images
    const propertyImageUrls = await Promise.all(
      task.property.images.map(async (image) => getFileUrl(image))
    );

    // Get file URLs for images
    const imageUrls = await Promise.all(
      task.images.map(async (image) => getFileUrl(image))
    );

    // Get file URLs for documents
    const documentUrls = await Promise.all(
      task.documents.map(async (document) => getFileUrl(document))
    );

    // Attach image URLs and document URLs to the task object
    task.propertyImageUrls = propertyImageUrls;
    task.imageUrls = imageUrls;
    task.documentUrls = documentUrls;

    res.status(200).json({ task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// src/models/Task.js
module.exports = (sequelize, DataTypes) => {
  const User = require("./User");
  const Package = require("./Package");
  const Service = require("./Service");
  const Subscription = require("./Subscription");
  const Property = require("./Property");
  const UserType = require("./UserType");

  const Task = sequelize.define("task", {
    task_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    package_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Package,
        key: "package_id",
      },
    },
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Service,
        key: "service_id",
      },
    },
    service_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    subscription_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Subscription,
        key: "subscription_id",
      },
    },
    property_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Property,
        key: "property_id",
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
    },
    agent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: "user_id",
      },
    },
    agent_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    agent_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    agent_mobile: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    assigned_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    assigned_start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    assigned_end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Ongoing", "Completed"),
      defaultValue: "Pending",
    },
    documents: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    previous_documents: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    previous_images: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    geo_fencing: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    geo_tagging: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    previous_geo_tagging: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    agent_assigned_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: "user_id",
      },
    },
    last_update_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: "user_id",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    agent_user_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: UserType,
        key: "user_type_id",
      },
    },
    chat: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  });

  return Task;
};

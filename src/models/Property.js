const Package = require("./Package");

module.exports = (sequelize, DataTypes) => {
  const User = require("./User");
  const UserTypeMapping = require("./UserTypeMapping");
  const PartnerBuilderProject = require("./PartnerBuilderProject");
  const Company = require("./Company");

  const Property = sequelize.define("property", {
    property_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    property_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING(255),
      allowNull: true,
      default: null,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    area: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    lat: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    long: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    town: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mandal: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    pincode: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    prop_unique_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    city_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    documents: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    document_verification: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      default: 0,
    },
    site_verification: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      default: 0,
    },
    is_verified: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      default: 0,
    },
    assign_agent: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      default: 0,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      default: null,
      references: {
        model: User,
        key: "user_id",
      },
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
    },
    last_update_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    partner_builder_project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      default: null,
      references: {
        model: PartnerBuilderProject,
        key: "partner_builder_project_id",
      },
    },
    reference_code: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      default: null,
      references: {
        model: Company,
        key: "company_id",
      },
    },
    reference_code_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    payment: {
      type: DataTypes.ENUM("Prepaid", "Postpaid"),
      defaultValue: null,
    },
    request_user_type_mapping_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      default: null,
      references: {
        model: UserTypeMapping,
        key: "user_type_mapping_id",
      },
    },
    is_active: {
      type: DataTypes.INTEGER,
      default: 1,
    },
    package_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Package,
        key: "package_id",
      },
    },
    verification_status: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  });

  return Property;
};

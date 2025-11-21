module.exports = (sequelize, DataTypes) => {
  const Company = require("./Company");

  const PartnerBuilderProject = sequelize.define("partner_builder_project", {
    partner_builder_project_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    partner_builder_project_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Company,
        key: "company_id",
      },
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
    payment: {
      type: DataTypes.ENUM("Prepaid", "Postpaid"),
    },
    project_unique_id: {
      type: DataTypes.STRING,
      allowNull: true,
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
  });

  return PartnerBuilderProject;
};

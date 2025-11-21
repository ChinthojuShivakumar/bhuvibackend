module.exports = (sequelize, DataTypes) => {
  const Company = require("./Company");
  const PartnerBuilderProject = require("./PartnerBuilderProject");

  const Commission = sequelize.define("commission", {
    commission_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Company,
        key: "company_id",
      },
    },
    partner_builder_project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: PartnerBuilderProject,
        key: "partner_builder_project_id",
      },
    },
    parent_id: {
      type: DataTypes.INTEGER,
      defaultValue: null,
    },
    commission_1: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: null,
    },
    commission_2: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: null,
    },
    commission_3: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: null,
    },
    commission_4: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: null,
    },
    commission_5: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: null,
    },
    commission_6: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: null,
    },
    commission_7: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: null,
    },
    commission_8: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: null,
    },
    commission_9: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: null,
    },
    slab_1: {
      type: DataTypes.INTEGER,
    },
    slab_2: {
      type: DataTypes.INTEGER,
    },
    slab_3: {
      type: DataTypes.INTEGER,
    },
    slab_4: {
      type: DataTypes.INTEGER,
    },
    slab_5: {
      type: DataTypes.INTEGER,
    },
    slab_6: {
      type: DataTypes.INTEGER,
    },
    slab_7: {
      type: DataTypes.INTEGER,
    },
    slab_8: {
      type: DataTypes.INTEGER,
    },
    slab_9: {
      type: DataTypes.INTEGER,
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      allowNull: false,
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
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    last_update_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1,
    },
    start_date: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    end_date: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    payment_type: {
      type: DataTypes.STRING(255),
      defaultValue: null,
    },
  });

  return Commission;
};

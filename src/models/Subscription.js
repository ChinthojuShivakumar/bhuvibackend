// src/models/Subscription.js
module.exports = (sequelize, DataTypes) => {
  const User = require('./User');
  const Package = require('./Package');
  const PartnerBuilderProject = require('./PartnerBuilderProject');
  const Company = require('./Company');

  const Subscription = sequelize.define('subscription', {
    subscription_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    package_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Package,
        key: 'package_id'
      }
    },
    package_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      default: null
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'user_id'
      }
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Pending'),
      defaultValue: 'Pending'
    },
    invoice: {
      type: DataTypes.JSON,
      allowNull: true
    },
    invoice_from_address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    invoice_to_address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    invoice_to_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    invoice_property_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    invoice_package_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    invoice_area: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    invoice_no: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    slab_level: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    price_level: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    invoice_date: {
      type: DataTypes.DATE,
      default: null
    },
    
    tasks_created: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      default: 0
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'user_id'
      }
    },
    last_update_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'user_id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    partner_builder_project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      default: null,
      references: {
        model: PartnerBuilderProject,
        key: 'partner_builder_project_id'
      }
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      default: null,
      references: {
        model: Company,
        key: 'company_id'
      }
    },
    commission: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      default: null
    }
  });

  return Subscription;
};

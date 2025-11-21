module.exports = (sequelize, DataTypes) => {
  const User = require('./User');
  const Package = require('./Package');
  const Service = require('./Service');

  const PackageService = sequelize.define('package_service', {
    package_service_id: {
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
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Service,
        key: 'service_id'
      }
    },
    package_service_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
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
    }
  });

  return PackageService;
};

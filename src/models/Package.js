module.exports = (sequelize, DataTypes) => {
  const User = require('./User');

  const Package = sequelize.define('package', {
    package_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    package_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    package_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    package_price_1: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    package_price_2: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    package_price_3: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    package_price_4: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    package_price_5: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    package_price_6: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    package_price_7: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    package_price_8: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    package_price_9: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false
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
    },
    slab_1: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    slab_2: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    slab_3: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    slab_4: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    slab_5: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    slab_6: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    slab_7: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    slab_8: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    slab_9: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    parent_id: {
      type: DataTypes.INTEGER
    },
    is_active: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1
    }
  });

  return Package;
};

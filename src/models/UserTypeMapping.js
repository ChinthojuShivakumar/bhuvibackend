module.exports = (sequelize, DataTypes) => {
    const User = require('./User');
    const UserType = require('./UserType');
  
    const UserTypeMapping = sequelize.define('user_type_mapping', {
      user_type_mapping_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: User,
          key: 'user_id'
        }
      },
      user_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: UserType,
          key: 'user_type_id'
        }
      },
      is_active: {
        type: DataTypes.TINYINT(1),
        allowNull: false,
        defaultValue: 1
      },
      status: {
        type: DataTypes.ENUM('Active', 'Pending', 'Inactive'),
        allowNull: false
      },
      is_admin: {
        type: DataTypes.TINYINT(1),
        allowNull: false,
        defaultValue: 0
      },
      is_superadmin: {
        type: DataTypes.TINYINT(1),
        allowNull: false,
        defaultValue: 0
      },
      unique_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        default: null
      },
    });
  
    return UserTypeMapping;
  };
  
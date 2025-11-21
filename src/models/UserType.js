module.exports = (sequelize,DataTypes) => {
  const UserTypeCategory = require('./UserTypeCategory');

  const UserType = sequelize.define('user_type', {
    user_type_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_type_name: {
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
    is_active: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1
    },
    user_type_category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: UserTypeCategory,
        key: 'user_type_category_id'
      }
    },
    user_type_category_name: {
      type: DataTypes.STRING(64),
      allowNull: false
    }
  });

  return UserType;

}
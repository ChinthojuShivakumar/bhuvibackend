module.exports = (sequelize, DataTypes) => {
  const User = require('./User');
  const Permission = require('./Permission');

  const UserTypePermission = sequelize.define('user_type_permission', {
    user_type_permission_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'user_type_id'
      }
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Permission,
        key: 'permission_id'
      }
    },
    is_view: {
      type: DataTypes.TINYINT,
      allowNull: false
    },
    is_add: {
      type: DataTypes.TINYINT,
      allowNull: false
    },
    is_edit: {
      type: DataTypes.TINYINT,
      allowNull: false
    },
    is_delete: {
      type: DataTypes.TINYINT,
      allowNull: false
    },
    is_active: {
      type: DataTypes.TINYINT,
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
    }
  });

  return UserTypePermission;
};

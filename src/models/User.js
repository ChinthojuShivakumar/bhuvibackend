module.exports = (sequelize, DataTypes) => {
  // const UserType = require('./UserType');

  const User = sequelize.define("user", {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    first_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    mobile: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    project_id: {
      type: DataTypes.INTEGER,
      default: null,
    },
    // status: {
    //   type: DataTypes.ENUM('Active', 'Pending', 'Inactive'),
    //   allowNull: false
    // },
    // user_type_id: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    //   references: {
    //     model: UserType,
    //     key: 'user_type_id'
    //   }
    // },
    // is_admin: {
    //   type: DataTypes.BOOLEAN,
    //   allowNull: false,
    //   defaultValue: false
    // },
    // is_superadmin: {
    //   type: DataTypes.BOOLEAN,
    //   allowNull: false,
    //   defaultValue: false
    // },
    // is_active: {
    //   type: DataTypes.BOOLEAN,
    //   allowNull: false,
    //   defaultValue: true
    // },
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
    email_otp: {
      type: DataTypes.STRING(6),
      allowNull: true,
    },
    referred_by: {
      type: DataTypes.INTEGER,
      default: null,
    },
    dob: {
      type: DataTypes.DATE,
      default: null,
    },
  });

  // User.associate = (models) => {
  //   User.belongsTo(models.UserType, {
  //     foreignKey: 'user_type',
  //     allowNull: false
  //   });
  // };

  return User;
};

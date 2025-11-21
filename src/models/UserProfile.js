module.exports = (sequelize, DataTypes) => {
  const User = require('./User');

  const UserProfile = sequelize.define('user_profile', {
    user_profile_id: {
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
    first_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    mobile: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    current_address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    current_town: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    current_mandal: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    current_city: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    current_state: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    current_country: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    current_pincode: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    permanent_address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    permanent_town: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    permanent_mandal: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    permanent_city: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    permanent_state: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    permanent_country: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    permanent_pincode: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: true
    },
    gstin: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    image: {
      type: DataTypes.STRING(255),
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
    }
  });

  return UserProfile;
};

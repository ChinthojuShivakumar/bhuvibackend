module.exports = (sequelize, DataTypes) => {
    const Company = sequelize.define('company', {
      company_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      company_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      town: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      mandal: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      city: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      state: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      country: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      pincode: {
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
  
    return Company;
  };
  
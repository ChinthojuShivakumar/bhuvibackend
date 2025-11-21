module.exports = (sequelize, DataTypes) => {
    const Pincode = sequelize.define('pincode', {
      pincode_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      locality: {
        type: DataTypes.STRING,
      },
      pincode: {
        type: DataTypes.STRING,
      },
      town: {
        type: DataTypes.STRING,
      },
      city: {
        type: DataTypes.STRING,
      },
      city_code: {
        type: DataTypes.STRING,
      },
      state: {
        type: DataTypes.STRING,
      },
      state_code: {
        type: DataTypes.STRING,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    });
  
    return Pincode;
  };
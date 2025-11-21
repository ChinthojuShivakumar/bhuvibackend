module.exports = (sequelize, DataTypes) => {
    const UserType = require('./UserType');
  
    const ChannelPartnerCategory = sequelize.define('channel_partner_category', {
      channel_partner_category_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: UserType,
          key: 'user_type_id'
        }
      },
      level: {
        type: DataTypes.INTEGER(2)
      },
      promotion_revenue: {
        type: DataTypes.INTEGER(11)
      },
      commission_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
      },
      next_commission_percent: {
        type: DataTypes.DECIMAL(5, 2)
      }
    });
  
    return ChannelPartnerCategory;
  };
  
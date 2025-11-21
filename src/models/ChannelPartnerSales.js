module.exports = (sequelize, DataTypes) => {
    const ChannelPartner = require('./ChannelPartner');
    const UserTypeMapping = require('./UserTypeMapping');
    const Property = require('./Property');
    const Subscription = require('./Subscription');
  
    const ChannelPartnerSales = sequelize.define('channel_partner_sales', {
      channel_partner_sales_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      base_channel_partner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: ChannelPartner,
          key: 'channel_partner_id'
        }
      },
      channel_partner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: ChannelPartner,
          key: 'channel_partner_id'
        }
      },
      user_type_mapping_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: UserTypeMapping,
          key: 'user_type_mapping_id'
        }
      },
      property_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Property,
          key: 'property_id'
        }
      },
      subscription_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Subscription,
          key: 'subscription_id'
        }
      },
      package_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      commission_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
      },
      commission: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      base_commission_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
      },
      base_commission: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      }
    });
  
    return ChannelPartnerSales;
  };
  
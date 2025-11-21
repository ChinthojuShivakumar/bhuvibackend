module.exports = (sequelize, DataTypes) => {
    const UserTypeMapping = require('./UserTypeMapping');
    const User = require('./User');
    const ChannelPartner = require('./ChannelPartner');
    const ChannelPartnerCategory = require('./ChannelPartnerCategory');
  
    const ChannelPartnerHistory = sequelize.define('channel_partner_history', {
      channel_partner_history_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      channel_partner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: ChannelPartner,
          key: 'channel_partner_id'
        }
      },
      channel_partner_category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: ChannelPartnerCategory,
          key: 'channel_partner_category_id'
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
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: User,
          key: 'user_id'
        }
      },
      total_revenue: {
        type: DataTypes.DECIMAL(11, 2)
      },
      total_cumulative_revenue: {
        type: DataTypes.DECIMAL(11, 2)
      },
      total_commission: {
        type: DataTypes.DECIMAL(11, 2)
      },
      total_cumulative_commission: {
        type: DataTypes.DECIMAL(11, 2)
      },
      total_referred: {
        type: DataTypes.INTEGER(10)
      },
      parent_channel_partner_id: {
        type: DataTypes.INTEGER(11)
      },
      referral_code: {
        type: DataTypes.STRING(64)
      },
      next_channel_partner_category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        default: null,
        references: {
          model: ChannelPartnerCategory,
          key: 'channel_partner_category_id'
        }
      },
      effective_date: {
        type: DataTypes.DATE,
        allowNull: true,
        default: null
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      promoted_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        default: null,
        references: {
          model: User,
          key: 'user_id'
        }
      }
    });
  
    return ChannelPartnerHistory;
  };
  
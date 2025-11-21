module.exports = (sequelize, DataTypes) => {
    const User = require('./User');
    const Company = require('./Company');
    const UserTypeMapping = require('./UserTypeMapping');
  
    const PartnerBuilder = sequelize.define('partner_builder', {
      partner_builder_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Company,
          key: 'company_id'
        }
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
  
    return PartnerBuilder;
  };

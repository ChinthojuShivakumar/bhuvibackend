module.exports = (sequelize, DataTypes) => {
  const User = require('./User');
  const Document = sequelize.define('document', {
    document_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    document_series: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    document_type: {
      type: DataTypes.ENUM('Invoice', 'Debit Note', 'Credit Note', 'Customer', 'CP', 'PB', 'Agent', 'Admin', 'Super Admin'),
      allowNull: false
    },
    sequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    last_update_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'user_id'
      }
    },
  });

  return Document;
};
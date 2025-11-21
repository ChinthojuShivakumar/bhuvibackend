module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define('permission', {
    permission_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    permission_category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'permission',
        key: 'permission_id'
      }
    },
    permission_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    is_category: {
      type: DataTypes.TINYINT(1),
      allowNull: false
    },
    is_active: {
      type: DataTypes.TINYINT(1),
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
    }
  });

  return Permission;
};

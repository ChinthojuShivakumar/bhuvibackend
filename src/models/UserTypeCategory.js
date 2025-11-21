module.exports = (sequelize, DataTypes) => {  
    const UserTypeCategory = sequelize.define('user_type_category', {
      user_type_category_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_type_category_name: {
        type: DataTypes.STRING(64)
      },
      is_active: {
        type: DataTypes.TINYINT(1),
        allowNull: false,
        defaultValue: 1
      }
    });
  
    return UserTypeCategory;
  };
  
  // +-----------------------+-------------------------+-----------+
  // | user_type_category_id | user_type_category_name | is_active |
  // +-----------------------+-------------------------+-----------+
  // |                     1 | Super Admin             |         1 |
  // |                     2 | Admin                   |         1 |
  // |                     3 | Customer                |         1 |
  // |                     4 | Agent                   |         1 |
  // |                     5 | Partner Builder         |         1 |
  // |                     6 | Channel Partner         |         1 |
  // +-----------------------+-------------------------+-----------+
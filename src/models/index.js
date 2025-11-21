const Sequelize = require("sequelize");
const dbConfig = require("../config/dbConfig");

const env = process.env.NODE_ENV || "development";
console.log("⏺️ Using config for:", env); // Add this log
const config = dbConfig[env];

// Create a new Sequelize instance using the database configuration for the current environment
// const sequelize = new Sequelize(dbConfig[process.env.NODE_ENV]);
const sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: config.dialect,
  dialectOptions: {
    ssl: {
      rejectUnauthorized: true,
    },
  }, // ← MUST BE INCLUDED
  define: {
    timestamps: false,
    freezeTableName: true,
  },
  logging: false,
});

// Import your models
const User = require("./User")(sequelize, Sequelize);
const UserProfile = require("./UserProfile")(sequelize, Sequelize);
const UserTypeCategory = require("./UserTypeCategory")(sequelize, Sequelize);
const UserType = require("./UserType")(sequelize, Sequelize);
const UserTypeMapping = require("./UserTypeMapping")(sequelize, Sequelize);
const Permission = require("./Permission")(sequelize, Sequelize);
const UserTypePermission = require("./UserTypePermission")(
  sequelize,
  Sequelize
);
const Package = require("./Package")(sequelize, Sequelize);
const PackageService = require("./PackageService")(sequelize, Sequelize);
const Property = require("./Property")(sequelize, Sequelize);
const Service = require("./Service")(sequelize, Sequelize);
const Subscription = require("./Subscription")(sequelize, Sequelize);
const Task = require("./Task")(sequelize, Sequelize);
const Pincode = require("./Pincode")(sequelize, Sequelize);
const ChannelPartnerCategory = require("./ChannelPartnerCategory")(
  sequelize,
  Sequelize
);
const ChannelPartner = require("./ChannelPartner")(sequelize, Sequelize);
const ChannelPartnerSales = require("./ChannelPartnerSales")(
  sequelize,
  Sequelize
);
const Company = require("./Company")(sequelize, Sequelize);
const PartnerBuilderProject = require("./PartnerBuilderProject")(
  sequelize,
  Sequelize
);
const Commission = require("./Commission")(sequelize, Sequelize);
const PartnerBuilder = require("./PartnerBuilder")(sequelize, Sequelize);
const ChannelPartnerHistory = require("./ChannelPartnerHistory")(
  sequelize,
  Sequelize
);
const Document = require("./Document")(sequelize, Sequelize);

// Define model associations
UserType.belongsTo(UserTypeCategory, { foreignKey: "user_type_category_id" });

UserTypeMapping.belongsTo(User, { foreignKey: "user_id" });
UserTypeMapping.belongsTo(UserType, { foreignKey: "user_type_id" });

ChannelPartner.belongsTo(ChannelPartnerCategory, {
  foreignKey: "channel_partner_category_id",
  as: "channelPartnerCategory",
});
ChannelPartner.belongsTo(UserTypeMapping, {
  foreignKey: "user_type_mapping_id",
  as: "userTypeMapping",
});
ChannelPartner.belongsTo(User, { foreignKey: "user_id" });

ChannelPartnerCategory.belongsTo(UserType, { foreignKey: "user_type_id" });

ChannelPartnerSales.belongsTo(ChannelPartner, {
  foreignKey: "channel_partner_id",
});
ChannelPartnerSales.belongsTo(UserTypeMapping, {
  foreignKey: "user_type_mapping_id",
});
ChannelPartnerSales.belongsTo(Property, { foreignKey: "property_id" });
ChannelPartnerSales.belongsTo(Subscription, { foreignKey: "subscription_id" });

Commission.belongsTo(Company, { foreignKey: "company_id" });
Commission.belongsTo(PartnerBuilderProject, {
  foreignKey: "partner_builder_project_id",
});

PartnerBuilder.belongsTo(User, { foreignKey: "user_id" });
PartnerBuilder.belongsTo(Company, { foreignKey: "company_id" });
PartnerBuilder.belongsTo(UserTypeMapping, {
  foreignKey: "user_type_mapping_id",
});

PartnerBuilderProject.belongsTo(Company, { foreignKey: "company_id" });
Property.belongsTo(PartnerBuilderProject, {
  foreignKey: "partner_builder_project_id",
  as: "partner_builder_project",
});
Property.belongsTo(Company, { foreignKey: "company_id" });

User.hasMany(UserTypeMapping, { foreignKey: "user_id" });

User.hasOne(UserProfile, { foreignKey: "user_id" });
UserProfile.belongsTo(User, { foreignKey: "user_id" });

// User.belongsTo(UserType, { foreignKey: 'user_type_id' });
// UserType.hasMany(User, { foreignKey: 'user_type_id' });

UserType.belongsToMany(Permission, {
  through: UserTypePermission,
  foreignKey: "user_type_id",
});
Permission.belongsToMany(UserType, {
  through: UserTypePermission,
  foreignKey: "permission_id",
});

UserTypePermission.belongsTo(UserType, { foreignKey: "user_type_id" });
UserType.hasMany(UserTypePermission, { foreignKey: "user_type_id" });

UserTypePermission.belongsTo(Permission, { foreignKey: "permission_id" });
Permission.hasMany(UserTypePermission, { foreignKey: "user_type_id" });

PackageService.belongsTo(Package, { foreignKey: "package_id", as: "Package" });
Package.hasMany(PackageService, {
  foreignKey: "package_id",
  as: "PackageServices",
});

PackageService.belongsTo(Service, { foreignKey: "service_id", as: "Service" });
Service.hasMany(PackageService, {
  foreignKey: "service_id",
  as: "PackageServices",
});

// PackageService.belongsTo(User, { foreignKey: 'created_by' });
// User.hasMany(PackageService, { foreignKey: 'created_by' });

// Package.belongsToMany(Service, { through: PackageService, foreignKey: 'package_id' });
// Service.belongsToMany(Package, { through: PackageService, foreignKey: 'service_id' });

Property.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(Property, { foreignKey: "user_id" });

Subscription.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(Subscription, { foreignKey: "user_id" });

Subscription.belongsTo(Property, { foreignKey: "property_id" });
Property.hasMany(Subscription, { foreignKey: "property_id" });

Subscription.belongsTo(Package, { foreignKey: "package_id", as: "Package" });
Package.hasMany(Subscription, {
  foreignKey: "package_id",
  as: "Subscriptions",
});

// Service.hasMany(Subscription, { foreignKey: 'service_id' });
// Subscription.belongsTo(Service, { foreignKey: 'service_id' });

Task.belongsTo(Service, { foreignKey: "service_id" });
Service.hasMany(Task, { foreignKey: "service_id" });

Task.belongsTo(Property, { foreignKey: "property_id" });
Property.hasMany(Task, { foreignKey: "property_id" });

Task.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(Task, { foreignKey: "user_id" });

Task.belongsTo(Subscription, { foreignKey: "subscription_id" });
Subscription.hasMany(Task, { foreignKey: "subscription_id" });

Task.belongsTo(Package, { foreignKey: "package_id" });
Package.hasMany(Task, { foreignKey: "package_id" });

Property.hasOne(Package, {
  sourceKey: "package_id",
  foreignKey: "package_id",
  as: "package",
});

// ...

// Export the sequelize instance and models
module.exports = {
  Sequelize,
  sequelize,
  User,
  UserProfile,
  UserTypeCategory,
  UserType,
  UserTypeMapping,
  Permission,
  UserTypePermission,
  Package,
  PackageService,
  Property,
  Service,
  Subscription,
  Task,
  Pincode,
  ChannelPartnerCategory,
  ChannelPartner,
  ChannelPartnerSales,
  Company,
  PartnerBuilderProject,
  Commission,
  PartnerBuilder,
  Document,
  ChannelPartnerHistory,
};

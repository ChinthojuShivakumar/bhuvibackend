// src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const taskService = require("../services/taskService");
const propertyController = require("../controllers/propertyController");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

// router.use(authMiddleware.isAdminOrSuperadmin);
router.use(authMiddleware.addUserToRequest);

router.get("/users", adminController.getAllUsers);
router.get("/users-with-details", adminController.getUsersWithDetails);
router.post("/add-user", adminController.addUser);
router.put("/edit-user/:user_id", adminController.editUser);
router.put("/edit-user-password/:user_id", adminController.editUserPassword);

router.get("/user-types", adminController.getAllUserTypes);
router.post("/add-user-type", adminController.addUserType);
router.put("/edit-user-type/:user_type_id", adminController.editUserType);
router.get("/permissions", adminController.getAllPermissions);

router.get("/properties", adminController.getAllProperties);
router.put("/verify-property/:property_id", propertyController.verifyProperty);

router.get("/services", adminController.getAllServices);
// router.get('/packages-test', adminController.getAllPackagesWithServicesUsingPackageServices);
router.post("/add-service", adminController.addService);
router.put("/edit-service/:service_id", adminController.editService);
router.delete("/delete-service/:service_id", adminController.deleteService);

router.post("/add-package", adminController.addPackage);
router.put("/edit-package/:package_id", adminController.editPackage);

router.put(
  "/edit-subscription/:subscription_id",
  adminController.editSubscription
);

router.get("/dashboard", adminController.adminDashboard);
router.get("/getadmindashboardcount", adminController.getAdminDashboardCount);

router.post(
  "/verification-to-super-admin",
  authController.verificationEmailToSuperadmins
);

router.get(
  "/commission/:partner_builder_project_id",
  adminController.getCommission
);
router.get(
  "/get-commission-for-child/:commission_id",
  adminController.getCommissionForChild
);
router.post("/add-commission", adminController.addCommission);
router.put("/edit-commission/:commission_id", adminController.editCommission);

router.get("/companies", adminController.getAllCompanies);
router.get("/projects/:company_id", adminController.getAllProjectsByCompanyId);

router.get("/channel-partner-sales", adminController.getChannelPartnerSales);
router.post("/cp-tree", adminController.getChannelPartnerTreeForAdmin);

router.get("/channel-partners", adminController.getAllChannelPartnersForAdmin);
router.get(
  "/channel-partner-categories",
  adminController.getAllChannelPartnerCategories
);
router.post("/update-cp-commission", adminController.promoteChannelPartner);
router.get(
  "/getsubscriptionidbyproperty",
  taskService.getSubscriptionIdByProperty
);
router.post("/createtask", taskService.addTasks);
router.post("/getinvoice", adminController.generateInvoiceById);
module.exports = router;

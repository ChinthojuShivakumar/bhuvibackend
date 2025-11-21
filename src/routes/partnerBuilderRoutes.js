// src/routes/partnerBuilderRoutes.js
const express = require("express");
const multer = require("multer");
const router = express.Router();
// const adminController = require('../controllers/adminController');
const partnerBuilderController = require("../controllers/partnerBuilderController");
// const authController = require('../controllers/authController');
const authMiddleware = require("../middlewares/authMiddleware");
const adminController = require("../controllers/adminController");
const upload = multer();

router.use(authMiddleware.addUserToRequest);
router.get("/user-types", adminController.getAllUserTypes);
router.get("/projects", partnerBuilderController.getProjects);
router.post("/project", partnerBuilderController.createProject);
// router.post("/project", partnerBuilderController.addProject);
router.put(
  "/project/:partner_builder_project_id",
  partnerBuilderController.editProject
);
// router.get('/project/:partner_builder_project_id', partnerBuilderController.getProject);

router.get("/company", partnerBuilderController.getCompany);
router.post("/getcompanydetailsbyuserid", partnerBuilderController.getCompanyDetailsByUserId);
router.put("/company", partnerBuilderController.editCompany);

router.get(
  "/generate-reference-code/:property_id",
  partnerBuilderController.generateReferenceCode
);
router.get(
  "/property/:property_id",
  partnerBuilderController.getPropertyDetailsForPartnerBuilder
);

router.get("/users", partnerBuilderController.getPartnerBuilderUsers);
router.post("/add-user", partnerBuilderController.addPartnerBuilderUser);
router.put(
  "/edit-user/:user_id",
  partnerBuilderController.editPartnerBuilderUser
);
router.get("/companies", adminController.getAllCompanies);

router.get("/dashboard", partnerBuilderController.partnerBuilderDashboard);
router.post(
  "/partnerbuilderprojectsandcompany",
  partnerBuilderController.getPartnerBuilderProjectsListWithCompany
);
router.post(
  "/billinglistbyusers",
  partnerBuilderController.getUsersBillingListByPartnerBuilder
);

module.exports = router;

// src/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");

const userProfileController = require("../controllers/userProfileController");
const propertyController = require("../controllers/propertyController");
const userController = require("../controllers/userController");
const taskController = require("../controllers/taskController");
const utilsController = require("../controllers/utilsController");
const adminController = require("../controllers/adminController");

const authMiddleware = require("../middlewares/authMiddleware");
const {
  getVideoCallingToken,
} = require("../controllers/videoCallingController");

const upload = multer();

router.use(authMiddleware.addUserToRequest);

router.get("/packages", adminController.getAllPackagesWithServices);

// router.put('/add-user-profile', userProfileController.addUserProfile);
router.put(
  "/edit-user-profile/:user_id",
  upload.fields([{ name: "images", maxCount: 1 }]),
  userProfileController.editUserProfile
);
router.get("/get-user-profile/:user_id", userProfileController.getUserProfile);
router.get("/get-user-data/:user_id", userProfileController.getUserData);
router.get("/properties", userController.getPropertiesForUser);
router.get("/property/:property_id", propertyController.getPropertyDetails);
router.get("/dashboard", userController.userDashboard);

router.get("/get-tasks", taskController.getTasks);
router.get("/get-task/:task_id", taskController.getTask);
router.put(
  "/edit-task/:task_id",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "documents", maxCount: 10 },
  ]),
  taskController.editTask
);

router.get("/get-pincode-data", utilsController.getPincodeData);

router.get("/referred_by", userController.getReferredBy);

router.get("/generate-token/:task_id", getVideoCallingToken);
router.post("/propertyPackageValid", userController.property_package_valid);

router.post("/getdashboard", userController.getDashboard);
router.get("/getbillinglistbyuser", userController.getBillingListByUser);
module.exports = router;

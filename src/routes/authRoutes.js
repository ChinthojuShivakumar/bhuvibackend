// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/admin-login", authController.adminLogin);
router.post("/customer-login", authController.customerLogin);
router.post("/customer-sign-up", authController.customerSignup);
router.post("/verify-email", authController.verifyEmail);
router.post("/forgot-password-otp", authController.forgotPasswordOtp);
router.post("/reset-password", authController.resetPassword);

router.post("/partner-builder-sign-up", authController.partnerBuilderSignup);

// ---------------------------------- API CREATED BY SHIVA KUMAR ------------------------------------------------------------

router.post("/login", authController.login);
router.post("/create", authController.createUser);

module.exports = router;

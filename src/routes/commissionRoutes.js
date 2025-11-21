// src/routes/agentRoutes.js
const express = require("express");
const commissionRoute = express.Router();
const commissionController = require("../controllers/commissionController.js");
const authMiddleware = require("../middlewares/authMiddleware");

commissionRoute.use(authMiddleware.addUserToRequest);

commissionRoute.get(
  "/getallcommissionlistforsuperadmin",
  commissionController.getAllCommissionListForSuperAdmin
);

module.exports = commissionRoute;

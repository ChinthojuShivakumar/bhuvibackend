// src/routes/agentRoutes.js
const express = require("express");
const agentRoute = express.Router();
const agentController = require("../controllers/agentController.js");
const authMiddleware = require("../middlewares/authMiddleware.js");

agentRoute.use(authMiddleware.addUserToRequest);

agentRoute.post("/getdashboard", agentController.getDashboard);

module.exports = agentRoute;

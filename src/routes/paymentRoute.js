// src/routes/agentRoutes.js
const express = require("express");
const paymentRoute = express.Router();
const paymentController = require("../controllers/paymentController.js");

paymentRoute.post("/verifyorder", paymentController.verifyOrder);
paymentRoute.post("/addorder", paymentController.addOrder);
paymentRoute.post("/createrefund", paymentController.createRefund);
paymentRoute.post("/verifyrefund", paymentController.verifyRefund);

module.exports = paymentRoute;

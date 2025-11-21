// src/routes/agentRoutes.js
const express = require("express");
const agoraRoutes = express.Router();
const agoraChatController = require("../controllers/agoraController.js");
const authMiddleware = require("../middlewares/authMiddleware.js");

agoraRoutes.get("/getchattoken", agoraChatController.getChatToken);

module.exports = agoraRoutes;

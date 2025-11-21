// src/routes/agentRoutes.js
const express = require("express");
const faqRoutes = express.Router();
const faqController = require("../controllers/faqController.js");
const authMiddleware = require("../middlewares/authMiddleware");

faqRoutes.use(authMiddleware.addUserToRequest);
faqRoutes.post("/create", faqController.createFAQ);
faqRoutes.put("/update", faqController.updateFAQ);
faqRoutes.get("/list", faqController.getAllFAQ);
faqRoutes.get("/single/:id", faqController.getSingleFAQ);

module.exports = faqRoutes;

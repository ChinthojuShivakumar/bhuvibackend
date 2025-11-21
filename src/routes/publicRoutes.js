// src/routes/agentRoutes.js
const express = require("express");
const publicRoutes = express.Router();
const publicController = require("../controllers/publicendpointsController");
const customerSupportController = require("../controllers/customerSupport.js");
const leadController = require("../controllers/leadController.js");
const adminController = require("../controllers/adminController.js");

publicRoutes.get("/getallcompanylist", publicController.getAllCompanyList);
publicRoutes.post("/getintouch", publicController.getInTouch);
publicRoutes.get("/faqlist", publicController.getAllFAQ);

// ------------------------------------------------------- Customer Support ----------------------------------------------------------
publicRoutes.post(
  "/createticketbyuser",
  customerSupportController.createTicket
);

publicRoutes.post("/createlead", leadController.createLead);

publicRoutes.post(
  "/propertlistybyproject",
  leadController.getPropertyListByProject
);
publicRoutes.get(
  "/getcustomerpropertyandcount",
  leadController.getCustomerPropertyAndCount
);

publicRoutes.get("/companies", adminController.getAllCompanies);
module.exports = publicRoutes;

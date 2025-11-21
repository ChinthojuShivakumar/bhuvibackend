// src/routes/agentRoutes.js
const express = require("express");
const leadRoutes = express.Router();
const leadController = require("../controllers/leadController.js");
const authMiddleware = require("../middlewares/authMiddleware");

leadRoutes.use(authMiddleware.addUserToRequest);

leadRoutes.get("/list", leadController.getAllLeadList);
leadRoutes.post("/create", leadController.createLead);
leadRoutes.put("/update", leadController.updateLead);
// leadRoutes.put("/update", leadController.updateLead);
leadRoutes.put("/single/:id", leadController.getSingleLead);

// opportunity list apis

leadRoutes.get("/opportunitylist", leadController.getOpportunityList);
leadRoutes.post(
  "/propertlistybyproject",
  leadController.getPropertyListByProject
);
leadRoutes.get(
  "/getcustomerpropertyandcount",
  leadController.getCustomerPropertyAndCount
);
leadRoutes.get("/getagentlist", leadController.getAgentList);

leadRoutes.get("/listlead", leadController.getAllLeadsListForSuperAdmin);

leadRoutes.put("/updatepartner", leadController.updatePartner);
leadRoutes.get("/getdahsboardcount", leadController.getCRMDashboardCount);

module.exports = leadRoutes;

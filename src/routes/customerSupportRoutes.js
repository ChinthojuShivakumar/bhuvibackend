// src/routes/agentRoutes.js
const express = require("express");
const customerSupportRoute = express.Router();
const customerSupportController = require("../controllers/customerSupport.js");
const authMiddleware = require("../middlewares/authMiddleware");

customerSupportRoute.use(authMiddleware.addUserToRequest);
customerSupportRoute.post(
  "/createticket",
  customerSupportController.createTicket
);
customerSupportRoute.put(
  "/updateticket",
  customerSupportController.updateTicket
);
customerSupportRoute.get(
  "/getalltickets",
  customerSupportController.getAllTickets
);
customerSupportRoute.get(
  "/getsingleticket/:id",
  customerSupportController.getSingleTicket
);
customerSupportRoute.get(
  "/getcountdata",
  customerSupportController.getAllCountData
);

customerSupportRoute.post(
  "/getallticketbyuser",
  customerSupportController.getAllTicketsByUser
);

module.exports = customerSupportRoute;

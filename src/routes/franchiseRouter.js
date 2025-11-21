// src/routes/agentRoutes.js
const express = require("express");
const franchiseRouter = express.Router();
const franchiseController = require("../controllers/franchiseController.js");
const authMiddleware = require("../middlewares/authMiddleware");

franchiseRouter.use(authMiddleware.addUserToRequest);

// franchiseRouter.post("/create", franchiseController.createFranchise);
// franchiseRouter.get("/list", franchiseController.fetchFranchiseList);
// franchiseRouter.put("/update", franchiseController.updateFranchise);
// franchiseRouter.delete("/delete", franchiseController.deleteFranchise);
// franchiseRouter.get("/single/:id", franchiseController.singleFranchise);
franchiseRouter.post("/create", franchiseController.createFranchiseWithUser);
franchiseRouter.put("/update", franchiseController.updateFranchiseWithUser);
franchiseRouter.get("/list", franchiseController.fetchFranchiseLists);
franchiseRouter.get("/single/:id", franchiseController.getFranchisePartnerById);
franchiseRouter.delete("/delete", franchiseController.deleteFranchiseUser);

module.exports = franchiseRouter;

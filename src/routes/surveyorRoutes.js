// src/routes/agentRoutes.js
const express = require("express");
const surveyorRoute = express.Router();
const surveryorController = require("../controllers/surveyorController.js");
const authMiddleware = require("../middlewares/authMiddleware");

surveyorRoute.use(authMiddleware.addUserToRequest);

surveyorRoute.delete("/delete", surveryorController.deleteSurveyorUser);
surveyorRoute.post("/create", surveryorController.createSurveyorUser);
surveyorRoute.put("/update", surveryorController.updateSurveyorUser);
surveyorRoute.get("/list", surveryorController.fetchSurveyorList);
surveyorRoute.get("/single/:id", surveryorController.getSingleSurveyorUser);
surveyorRoute.get("/delete", surveryorController.deleteSurveyorUser);

module.exports = surveyorRoute;

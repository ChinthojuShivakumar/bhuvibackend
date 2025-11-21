const express = require("express");
const chatRoutes = express.Router();
const chatController = require("../controllers/chatController.js");
const authMiddleware = require("../middlewares/authMiddleware");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Utility function to ensure folder structure
function ensureChatFolder(task_id) {
  const baseFolder = path.join(__dirname, "../../", "uploads/Chats");
  const taskFolder = path.join(baseFolder, String(task_id));

  if (!fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder);
    console.log(`Created base folder: ${baseFolder}`);
  }

  if (!fs.existsSync(taskFolder)) {
    fs.mkdirSync(taskFolder);
    console.log(`Created task folder: ${taskFolder}`);
  }

  return taskFolder;
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const taskId = req.body.task_id;
    if (!taskId) return cb(new Error("Missing task_id in request body"), null);

    const taskDir = ensureChatFolder(taskId);
    cb(null, taskDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

chatRoutes.use(authMiddleware.addUserToRequest);

chatRoutes.post(
  "/create",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "documents", maxCount: 5 },
  ]),
  chatController.createChat
);
chatRoutes.post(
  "/getallchatsbyuserandtask",
  chatController.getAllChatsByUserAndTask
);

module.exports = chatRoutes;

// src/routes/propertyRoutes.js
const express = require("express");
const propertyController = require("../controllers/propertyController");
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const upload = multer();

router.use(authMiddleware.addUserToRequest);

// router.post('/add-property', propertyController.addProperty);
router.post(
  "/add-property",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "documents", maxCount: 10 },
  ]),
  propertyController.addProperty
);
router.put(
  "/edit-property/:property_id",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "documents", maxCount: 10 },
  ]),
  propertyController.editProperty
);
router.post(
  "/invoice",
  upload.fields([{ name: "invoices", maxCount: 10 }]),
  propertyController.addInvoice
);

router.post(
  "/get-property-by-reference-code",
  propertyController.getPropertyByReferenceCode
);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/Bulk"); // Folder to store files
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const excelOrCSV = multer({ storage: storage });

router.post(
  "/getbulkproperties",
  excelOrCSV.single("file"),
  propertyController.getBulkProperties
);

module.exports = router;

require("dotenv").config();
require("./src/config/config"); // Import this before DB connection
console.log("🔍 NODE_ENV:", process.env.NODE_ENV);
console.log("🔍 DB Host:", process.env.DB_HOST_DEV);
console.log("🔍 DB User:", process.env.DB_USER_DEV);
console.log("🔍 DB Password:", process.env.DB_PASSWORD_DEV);
console.log("🔍 DB Name:", process.env.DB_NAME_DEV);
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const fs = require("fs-extra");
const https = require("https");
const app = express();
const morgan = require("morgan");
const puppeteer = require("puppeteer");
const ejs = require("ejs");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "Views"));

app.use(morgan("dev"));
// Middlewares - Place these first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({ origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] })
);

// ✅ Session middleware - AFTER cors and express.json
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Sequelize DB connection
const db = require("./src/models"); // This should export sequelize + models
const { sequelize } = db;

// Routes
const adminRoutes = require("./src/routes/adminRoutes");
const authRoutes = require("./src/routes/authRoutes");
const propertyRoutes = require("./src/routes/propertyRoutes");
const userRoutes = require("./src/routes/userRoutes");
const partnerBuilderRoutes = require("./src/routes/partnerBuilderRoutes");
const channelPartnerRoutes = require("./src/routes/channelPartnerRoutes");
const decrypt = require("./src/services/payment");
const ccavReqHandler = require("./src/payment/ccavRequestHandler.js");
const ccavResHandler = require("./src/payment/ccavResponseHandler.js");
const userTypeRoutes = require("./src/routes/userTypeRoutes.js");
const adminController = require("./src/controllers/adminController.js");
const franchiseRoutes = require("./src/routes/franchiseRouter.js");
const surveyorRoute = require("./src/routes/surveyorRoutes.js");
const commissionRoute = require("./src/routes/commissionRoutes.js");
const publicRoutes = require("./src/routes/publicRoutes.js");
const customerSupportRoute = require("./src/routes/customerSupportRoutes.js");
const faqRoutes = require("./src/routes/faqRoutes.js");
const leadRoutes = require("./src/routes/leadRoutes.js");
const paymentRoute = require("./src/routes/paymentRoute.js");
const chatRoutes = require("./src/routes/chatRoutes.js");
const agoraRoutes = require("./src/routes/agoraRoute.js");
const agentRoute = require("./src/routes/agentRoutes.js");

// Public routes
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

app.get("/user-types", adminController.getAllUserTypes);

// Custom routes
app.use("/admin", adminRoutes);
app.use("/auth", authRoutes);
app.use("/property", propertyRoutes);
app.use("/user", userRoutes);
app.use("/partner-builder", partnerBuilderRoutes);
app.use("/channel-partner", channelPartnerRoutes);
app.use("/", userTypeRoutes);
app.use("/franchise", franchiseRoutes);
app.use("/surveyor", surveyorRoute);
app.use("/commission", commissionRoute);
app.use("/public", publicRoutes);
app.use("/ticket", customerSupportRoute);
app.use("/faq", faqRoutes);
app.use("/lead", leadRoutes);
app.use("/payment", paymentRoute);
app.use("/chat", chatRoutes);
app.use("/agora", agoraRoutes);
app.use("/agent", agentRoute);

// CCAvenue routes
app.set("views", __dirname + "/src/payment/public");
app.engine("html", require("ejs").renderFile);

app.get("/about", (req, res) => {
  res.render("dataFrom.html");
});

app.post("/ccavRequestHandler", (req, res) => {
  ccavReqHandler.postReq(req, res);
});
``;

app.post("/ccavResponseHandler", (req, res) => {
  ccavResHandler.postRes(req, res);
});

app.post("/response", (req, res) => {
  const encResponse = req.body.encResp;
  const decryptedResponse = decrypt(encResponse);
  console.log("Decrypted Response:", decryptedResponse);
  res.send("Payment Response Received. Process this as per your logic.");
});

// Start the server only after DB connection success
const PORT = process.env.PORT || 4001;

// Optional: check Sequelize connection before starting server
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Connected to MySQL database.");

    // Optional: Run migrations or sync if needed
    // return sequelize.sync(); // Only if needed

    // Start server after DB connected
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });

    // If HTTPS needed (uncomment and configure as per your .env certs)
    /*
    const cert = process.env.fullchain;
    const key = process.env.privkey;
    if (cert && key) {
      const options = {
        cert: fs.readFileSync(cert),
        key: fs.readFileSync(key),
      };
      https.createServer(options, app).listen(PORT, () => {
        console.log(`🚀 HTTPS Server running at https://localhost:${PORT}`);
      });
    }
    */
  })
  .catch((err) => {
    console.error("❌ Unable to connect to MySQL:", err.message);
  });

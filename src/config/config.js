require("dotenv").config();
const fs = require("fs");
const path = require("path");

const env = process.env.NODE_ENV || "development";

// Load TiDB Cloud CA Certificate
const ca = fs.readFileSync(path.join(__dirname, "../../isrgrootx1.pem"));

let dbConfig = {};

if (env === "development") {
  dbConfig = {
    host: process.env.DB_HOST_DEV,
    user: process.env.DB_USER_DEV,
    password: process.env.DB_PASSWORD_DEV,
    database: process.env.DB_NAME_DEV,
    port: 4000, // ✅ REQUIRED for TiDB Cloud
    ssl: {
      ca,
      rejectUnauthorized: true, // ✅ REQUIRED
    },
  };
} else if (env === "test") {
  dbConfig = {
    host: process.env.DB_HOST_TEST,
    user: process.env.DB_USER_TEST,
    password: process.env.DB_PASSWORD_TEST,
    database: process.env.DB_NAME_TEST,
    port: 4000,
    ssl: {
      ca,
      rejectUnauthorized: true,
    },
  };
} else if (env === "production") {
  dbConfig = {
    host: process.env.DB_HOST_PROD,
    user: process.env.DB_USER_PROD,
    password: process.env.DB_PASSWORD_PROD,
    database: process.env.DB_NAME_PROD,
    port: 4000,
    ssl: {
      ca,
      rejectUnauthorized: true,
    },
  };
}

// Expose to process.env for other files
process.env.DB_HOST = dbConfig.host;
process.env.DB_USER = dbConfig.user;
process.env.DB_PASSWORD = dbConfig.password;
process.env.DB_NAME = dbConfig.database;
process.env.DB_PORT = dbConfig.port;

module.exports = dbConfig;

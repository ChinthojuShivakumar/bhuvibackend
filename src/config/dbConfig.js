const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

// Load CA certificate (correct relative path)
const ca = fs.readFileSync(path.join(__dirname, "../../isrgrootx1.pem"));

module.exports = {
  development: {
    dialect: "mysql",
    host: process.env.DB_HOST_DEV,
    user: process.env.DB_USER_DEV,
    port: 4000,
    password: process.env.DB_PASSWORD_DEV,
    database: process.env.DB_NAME_DEV,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: true,
      },
    },
  },
  test: {
    dialect: "mysql",
    host: process.env.DB_HOST_TEST,
    user: process.env.DB_USER_TEST,
    port: 4000,
    password: process.env.DB_PASSWORD_TEST,
    database: process.env.DB_NAME_TEST,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: true,
      },
    },
  },
  production: {
    dialect: "mysql",
    host: process.env.DB_HOST_PROD,
    user: process.env.DB_USER_PROD,
    port: 4000,
    password: process.env.DB_PASSWORD_PROD,
    database: process.env.DB_NAME_PROD,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: true,
      },
    },
  },
};

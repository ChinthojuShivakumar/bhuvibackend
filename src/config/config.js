require('dotenv').config();
const fs = require('fs')
const env = process.env.NODE_ENV || 'development';
const path = require("path");
const ca = fs.readFileSync(path.join(__dirname, "../../isrgrootx1.pem"));


let dbConfig = {};

if (env === 'development') {
  dbConfig = {
    host: process.env.DB_HOST_DEV,
    user: process.env.DB_USER_DEV,
    password: process.env.DB_PASSWORD_DEV,
    database: process.env.DB_NAME_DEV,
    ssl: { ca }
  };
} else if (env === 'test') {
  dbConfig = {
    host: process.env.DB_HOST_TEST,
    user: process.env.DB_USER_TEST,
    password: process.env.DB_PASSWORD_TEST,
    database: process.env.DB_NAME_TEST,
    ssl: { ca }
  };
} else if (env === 'production') {
  dbConfig = {
    host: process.env.DB_HOST_PROD,
    user: process.env.DB_USER_PROD,
    password: process.env.DB_PASSWORD_PROD,
    database: process.env.DB_NAME_PROD,
    ssl: { ca }
  };
}

process.env.DB_HOST = dbConfig.host;
process.env.DB_USER = dbConfig.user;
process.env.DB_PASSWORD = dbConfig.password;
process.env.DB_NAME = dbConfig.database;

module.exports = dbConfig;

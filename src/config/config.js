require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

let dbConfig = {};

if (env === 'development') {
  dbConfig = {
    host: process.env.DB_HOST_DEV,
    user: process.env.DB_USER_DEV,
    password: process.env.DB_PASSWORD_DEV,
    database: process.env.DB_NAME_DEV,
  };
} else if (env === 'test') {
  dbConfig = {
    host: process.env.DB_HOST_TEST,
    user: process.env.DB_USER_TEST,
    password: process.env.DB_PASSWORD_TEST,
    database: process.env.DB_NAME_TEST,
  };
} else if (env === 'production') {
  dbConfig = {
    host: process.env.DB_HOST_PROD,
    user: process.env.DB_USER_PROD,
    password: process.env.DB_PASSWORD_PROD,
    database: process.env.DB_NAME_PROD,
  };
}

process.env.DB_HOST = dbConfig.host;
process.env.DB_USER = dbConfig.user;
process.env.DB_PASSWORD = dbConfig.password;
process.env.DB_NAME = dbConfig.database;

module.exports = dbConfig;

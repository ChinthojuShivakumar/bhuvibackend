const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  development: {
    dialect: 'mysql',
    host: process.env.DB_HOST_DEV,
    user: process.env.DB_USER_DEV,
    password: process.env.DB_PASSWORD_DEV,
    database: process.env.DB_NAME_DEV
  },
  test: {
    dialect: 'mysql',
    host: process.env.DB_HOST_TEST,
    user: process.env.DB_USER_TEST,
    password: process.env.DB_PASSWORD_TEST,
    database: process.env.DB_NAME_TEST
  },
  production: {
    dialect: 'mysql',
    host: process.env.DB_HOST_PROD,
    user: process.env.DB_USER_PROD,
    password: process.env.DB_PASSWORD_PROD,
    database: process.env.DB_NAME_PROD
  }
};


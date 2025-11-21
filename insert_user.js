// insert_user.js

require('dotenv').config(); // Load environment variables from .env

const bcrypt = require('bcrypt');
const readlineSync = require('readline-sync');
const db = require('./src/models');
const { Op } = require('sequelize');

// Determine the environment (default to 'development' if not set)
const NODE_ENV = process.env.NODE_ENV || 'development';

// Database configuration based on NODE_ENV
let dbConfig;

switch (NODE_ENV) {
  case 'development':
    dbConfig = {
      host: process.env.DB_HOST_DEV,
      user: process.env.DB_USER_DEV,
      password: process.env.DB_PASSWORD_DEV,
      database: process.env.DB_NAME_DEV,
    };
    break;

  case 'test':
    dbConfig = {
      host: process.env.DB_HOST_TEST,
      user: process.env.DB_USER_TEST,
      password: process.env.DB_PASSWORD_TEST,
      database: process.env.DB_NAME_TEST,
    };
    break;

  case 'production':
    dbConfig = {
      host: process.env.DB_HOST_PROD,
      user: process.env.DB_USER_PROD,
      password: process.env.DB_PASSWORD_PROD,
      database: process.env.DB_NAME_PROD,
    };
    break;

  default:
    console.error(`Unknown NODE_ENV: ${NODE_ENV}`);
    process.exit(1);
}

// Function to prompt user details
async function promptUserDetails() {
  // your code ...
}

async function insertUser() {
  try {
    const userDetails = await promptUserDetails();
    const hashedPassword = await bcrypt.hash(userDetails.password, 10);

    let user_id;
    let userTypeMapping;

    await db.sequelize.transaction(async (t) => {
      // your existing transaction logic here ...
    });

    console.log('User inserted successfully!');
    console.log('user_id :: ', user_id);
    console.log('user_type_mapping_id :: ', userTypeMapping.user_type_mapping_id);
  } catch (err) {
    console.error('Error inserting user:', err.message);
  }
}

insertUser();

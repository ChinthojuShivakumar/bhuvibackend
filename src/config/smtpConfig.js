const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  // service: 'gmail',
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  senderEmail: process.env.SMTP_SENDER,
};


// config/razorpay.js
require("dotenv").config();
const Razorpay = require("razorpay");

const key_id = process.env.TEST_RAZORPAY_KEY_ID;
const key_secret = process.env.TEST_RAZORPAY_SECRET;

if (!key_id || !key_secret) {
  throw new Error("Razorpay keys missing in .env file");
}

const razorpay = new Razorpay({ key_id, key_secret });



console.log("Razorpay initialized:", key_id);
module.exports = razorpay;

// test.js
require("dotenv").config();
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.TEST_RAZORPAY_KEY_ID,
  key_secret: process.env.TEST_RAZORPAY_SECRET,
});

console.log("Testing Razorpay connection...");

razorpay.orders.all({ count: 1 })
  .then(res => {
    console.log("SUCCESS: API is working");
    console.log("Orders count:", res.count);
  })
  .catch(err => {
    console.log("API ERROR:");
    if (err.error) {
      console.log("Status Code:", err.error.statusCode);
      console.log("Description:", err.error.description);
    } else {
      console.log("Raw Error:", err.message || err);
    }
  });
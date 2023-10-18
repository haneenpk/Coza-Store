// Import the 'dotenv' and 'razorpay' modules using CommonJS 'require' syntax
const dotenv = require("dotenv");
dotenv.config();
const Razorpay = require("razorpay");

// Retrieve environment variables using CommonJS syntax
const RAZORPAY_ID_KEY = process.env.RAZORPAY_ID_KEY;
const RAZORPAY_SECRET_KEY = process.env.RAZORPAY_SECRET_KEY;

// Create 'razorpay' as a CommonJS export
const razorpay = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY,
});

// Export 'razorpay' for use in other CommonJS modules
module.exports = razorpay;

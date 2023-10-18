const mongoose = require("mongoose")

const userOTPVerificationSchema = mongoose.Schema({

    userId: String,
    otp: String,
    createdAt: Date,
    expiresAt: Date,

});

module.exports = mongoose.model("userOTPVerification",userOTPVerificationSchema);
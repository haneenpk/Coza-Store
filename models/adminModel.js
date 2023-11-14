const mongoose = require("mongoose");

const admin = new mongoose.Schema({
    email: {
        type: String,
    },
    name: {
        type: String,
    },
    password: {
        type: String,
    },
});

module.exports = mongoose.model("Admin", admin);
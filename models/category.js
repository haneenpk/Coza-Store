const mongoose = require("mongoose")

const category = mongoose.Schema({
    name: {
        type: String,
        require:true
    },
});

module.exports = mongoose.model("Category",category);
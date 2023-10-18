const mongoose = require("mongoose")

const addressSchema = mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require:true
    },
    name:{
        type:String,
        require:true
    },
    mobile:{
        type:Number,
        require:true
    },
    country:{
        type:String,
        require:true
    },
    state:{
        type:String,
        require:true
    },
    district:{
        type:String,
        require:true
    },
    city:{
        type:String,
        require:true
    },
    pincode:{
        type:Number,
        require:true
    },
    address:{
        type:String,
        require:true
    },
    default:{
        type:Boolean,
        default: false
    }
});

module.exports = mongoose.model("Address",addressSchema);
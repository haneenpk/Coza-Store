const mongoose = require("mongoose")

const products = mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    price:{
        type:Number,
        require:true
    },
    description:{
        type:String,
        require:true
    },
    stock:{
        type:Number,
        require:true
    },
    brand: {
        type: String,
        require:true
    },
    images:[String], 
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    rating: [
        {
            customer: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            rate: {
                type: Number
            },
            review: {
                type: String
            }
        }
    ],
});

module.exports = mongoose.model("Product",products);
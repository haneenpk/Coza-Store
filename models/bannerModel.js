const mongoose = require("mongoose")

const banners = mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    title:{
        type:String,
        require:true
    },
    image: {
        type: String,
        default: ''
    }, 
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
});

module.exports = mongoose.model("Banner",banners);
const mongoose = require("mongoose")

const transactionSchema = mongoose.Schema({
    amount: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    transactionId: {
        type: String,
        required: true,
    },
});

const walletSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
    },
    balance: {
        type: Number,
        default: 0,
    },
    transactions: [transactionSchema],
});


module.exports = mongoose.model('Wallet', walletSchema);
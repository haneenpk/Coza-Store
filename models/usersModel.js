const mongoose = require("mongoose");

const users = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profile: {
        type: String,
        default: ''
    },
    cart: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
            quantity: {
                type: Number,
                default: 1
            },
            total: {
                type: Number,
                default: 0
            }
        }
    ],
    totalCartAmount: {
        type: Number,
        default: 0
    },
    earnedCoupons: [
        {
            coupon: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Coupon',
            },
            isUsed: {
                type: Boolean,
                default: false,
            },
        }
    ],
    wallet: {
        balance: {
            type: Number,
            default: 0,
        },
        transactions: [{
            amount: {
                type: Number,
                required: true,
            },
            description: {
                type: String,
                required: true,
            },
            type: {
                type: String,
                enum: ['Credit', 'Debit'],
                required: true,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            }
        }],
    },
    wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }
    ],
    verified: {
        type: Boolean,
        required: true
    },
    is_admin: {
        type: Number,
        default: 0
    },
    blocked: {
        type: Boolean,
        default: false
    },
});

module.exports = mongoose.model("User", users);

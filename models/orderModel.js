const mongoose = require("mongoose")

const orderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
            },
            total: {
                type: Number,
                required: true,
            },
            isCancelled: {
                type: Boolean,
                default: false,
            },
            returnRequested: {
                type: String,
                enum: ['Nil', 'Pending', 'Approved', 'Rejected', 'Completed'],
                default: 'Nil',
            },
            cancelRequested: {
                type: String,
                enum: ['Nil', 'Pending', 'Approved', 'Rejected', 'Completed'],
                default: 'Nil',
            },
        },
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    orderDate: {
        type: Date,
        default: Date.now,
    },
    deliveryDate: {
        type: Date,
    },
    paymentMethod: {
        type: String,
        required: true
    },
    deliveryAddress: {
        type: {
            _id: mongoose.Schema.Types.ObjectId,
            userId: mongoose.Schema.Types.ObjectId,
            name: String,
            mobile: Number,
            country: String,
            state: String,
            district: String,
            city: String,
            pincode: Number,
            address: String,
        },
        ref: 'Address',
    },
    status: {
        type: String,
        enum: ['Processing', 'Shipped', 'Delivered', 'Pending', 'Cancelled'],
        default: 'Processing',
    },
    razorpayOrderId: {
        type: String,
    },
    transactionId: {
        type: String,
    }
});

// Add a pre-save hook to calculate the delivery date
orderSchema.pre('save', function (next) {
    const orderDate = this.orderDate;
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    this.deliveryDate = deliveryDate;

    next();
});

module.exports = mongoose.model("Order",orderSchema);
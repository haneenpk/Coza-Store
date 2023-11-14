const mongoose = require('mongoose');
const Order = require("../../models/orderModel")
const Return = require("../../models/returnProductsModel")
const Cancel = require("../../models/cancelProductsModel")
const Product = require("../../models/products")
const User = require("../../models/usersModel")
const Coupon = require("../../models/couponModel")


const loadOrder = async (req, res) => {
    const perPage = 8; // Number of orders per page
    const page = req.query.page || 1; // Get the current page from query parameters (default to page 1)

    const { customer, status } = req.query;

    try {
        let ordersQuery = Order.find().populate([{ path: 'products.product' }, { path: 'user' }])

        if (customer) {
            ordersQuery = ordersQuery.where('user.username').regex(new RegExp(customer, 'i'));
        }

        if (status) {
            ordersQuery = ordersQuery.where('status').equals(status);
        }

        const orders = await ordersQuery
            .sort({ orderDate: -1 }) // Sort by orderDate in descending order
            .skip((page - 1) * perPage) // Skip orders on previous pages
            .limit(perPage); // Limit the number of orders per page

        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / perPage);

        res.render("admin/order", {
            activePage: "order",
            orders,
            totalPages,
            currentPage: page,
        });
    } catch (error) {
        res.render("error/internalError", { error })
    }
};

const updateActionOrder = async (req, res) => {

    const order = await Order.findById(req.query.orderId)
    const userData = await User.findById(order.user)

    try {

        if(req.query.action === "Delivered"){
            // coupons
            const foundCoupon = await Coupon.findOne({
                isActive: true, minimumPurchaseAmount: { $lte: order.totalAmount }
            }).sort({ minimumPurchaseAmount: -1 });

            if (foundCoupon) {
                const couponExists = userData.earnedCoupons.some((coupon) => coupon.coupon.equals(foundCoupon._id));
                if (!couponExists) {
                    userData.earnedCoupons.push({ coupon: foundCoupon._id });
                }
            }

            await userData.save();
        }

        await Order.updateOne({ _id: req.query.orderId }, { status: req.query.action })

        res.redirect("/admin/order")

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const updateOrderCancel = async (req, res) => {

    try {

        const foundOrder = await Order.findById(req.query.orderId);

        for (let i = 0; i < foundOrder.products.length; i++) {
            foundOrder.products[i].isCancelled = true
        }

        foundOrder.status = req.query.action

        await foundOrder.save();

        res.redirect("/admin/order")
    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const getReturnRequests = async (req, res) => {
    try {
        const ITEMS_PER_PAGE = 5; // Define the number of items to display per page
        const page = parseInt(req.query.page) || 1; // Extract the page from the query string
        const totalRequests = await Return.countDocuments(); // Count the total number of return requests
        const returnRequests = await Return.find()
            .populate([
                { path: 'user' },
                { path: 'order' },
                { path: 'product' },
            ])
            .skip((page - 1) * ITEMS_PER_PAGE) // Calculate the number of items to skip
            .limit(ITEMS_PER_PAGE); // Define the number of items to display per page

        const totalPages = Math.ceil(totalRequests / ITEMS_PER_PAGE);

        res.render("admin/returns", {
            activePage: "order",
            returnRequests,
            totalPages,
        });
    } catch (error) {
        res.render("error/internalError", { error })
    }
};

const returnRequestAction = async (req, res) => {
    try {
        const foundRequet = await Return.findById(req.body.request);
        const foundOrders = await Order.findById(req.body.order);
        const currentProduct = foundOrders.products.find((product) => product.product.toString() === req.body.product.toString());
        if (req.body.action === "approve") {
            foundRequet.status = 'Approved';
            currentProduct.returnRequested = 'Approved';
        } else if (req.body.action === "Rejected") {
            foundRequet.status = 'Rejected';
            currentProduct.returnRequested = 'Rejected';
        } else {

            const currentUser = await User.findById(foundOrders.user)
            
            const EditProduct = await Product.findOne({ _id: req.body.product });
    
            const currentStock = EditProduct.stock;
            EditProduct.stock = currentStock + foundRequet.quantity;
    
            await EditProduct.save();
            
            const refundAmount = currentProduct.total;
            currentUser.wallet.balance += refundAmount;

            const transactionData = {
                amount: refundAmount,
                description: 'Returned product.',
                type: 'Credit',
            };

            currentUser.wallet.transactions.push(transactionData);

            // Save changes to the user's wallet, canceled product, and order
            await currentUser.save();

            foundRequet.status = 'Completed';
            currentProduct.returnRequested = 'Completed';
        }
        await foundRequet.save();
        await foundOrders.save();
        res.redirect('/admin/return-requests');
    } catch (error) {
        res.render("error/internalError", { error })
    }
};

const getCancelRequests = async (req, res) => {
    try {
        const ITEMS_PER_PAGE = 5; // Define the number of items to display per page
        const page = parseInt(req.query.page) || 1; // Extract the page from the query string
        const totalRequests = await Cancel.countDocuments(); // Count the total number of return requests
        const cancelRequests = await Cancel.find()
            .populate([
                { path: 'user' },
                { path: 'order' },
                { path: 'product' },
            ])
            .skip((page - 1) * ITEMS_PER_PAGE) // Calculate the number of items to skip
            .limit(ITEMS_PER_PAGE); // Define the number of items to display per page

        const totalPages = Math.ceil(totalRequests / ITEMS_PER_PAGE);

        res.render("admin/cancels", {
            activePage: "order",
            cancelRequests,
            totalPages,
        });
    } catch (error) {
        res.render("error/internalError", { error })
    }
}

const returnCancelAction = async (req, res) => {
    try {
        console.log("here");
        const foundCancel = await Cancel.findById(req.body.request);
        const foundOrders = await Order.findById(req.body.order).populate('products.product');
        console.log(foundOrders.products[0].product);
        const currentProduct = foundOrders.products.find((product) => product.product.toString() === req.body.product.toString());
        console.log(currentProduct);
        if (req.body.action === "approve") {
            foundCancel.status = 'Approved';
            console.log(currentProduct.cancelRequested);
            currentProduct.cancelRequested = 'Approved';
        } else if (req.body.action === "Rejected") {
            foundCancel.status = 'Rejected';
            currentProduct.cancelRequested = 'Rejected';
        } else {

            if (foundOrders.paymentMethod !== 'Cash on delivery') {
                const currentUser = await User.findById(req.session.user_id);
    
                if (currentUser) { // Check if currentUser is defined
                    const refundAmount = currentProduct.total;
                    currentUser.wallet.balance += refundAmount;
    
                    const transactionData = {
                        amount: refundAmount,
                        description: 'Order cancelled.',
                        type: 'Credit',
                    };
                    currentUser.wallet.transactions.push(transactionData);
    
                    // Save changes to the user's wallet, canceled product, and order
                    await currentUser.save();
                } else {
                    console.log("User not found");
                }
            }
            currentProduct.isCancelled = true;
    
            const EditProduct = await Product.findOne({ _id: currentProduct.product._id });
    
            const currentStock = EditProduct.stock;
            EditProduct.stock = currentStock + currentProduct.quantity;
    
            await EditProduct.save();
    
            // Function to check if all products in the order are cancelled
            function areAllProductsCancelled(order) {
                for (const product of order.products) {
                    if (!product.isCancelled) {
                        return false; // If any product is not cancelled, return false
                    }
                }
                return true; // All products are cancelled
            }
    
            // Check if all products in the order are cancelled
            if (areAllProductsCancelled(foundOrders)) {
                // Update the order status to "Cancelled"
    
                foundOrders.totalAmount -= 0
                foundOrders.status = "Cancelled";
            }
    
            await foundOrders.save();
            res.redirect("/order");

            foundCancel.status = 'Completed';
            currentProduct.cancelRequested = 'Completed';
        }
        await foundCancel.save();
        await foundOrders.save();
        res.redirect('/admin/cancel-requests');
    } catch (error) {
        res.render("error/internalError", { error })
    }
};


module.exports = {
    loadOrder,
    updateActionOrder,
    updateOrderCancel,
    getReturnRequests,
    returnRequestAction,
    getCancelRequests,
    returnCancelAction,
}
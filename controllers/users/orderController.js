const mongoose = require('mongoose');
const User = require("../../models/usersModel")
const Category = require("../../models/category")
const Address = require("../../models/addressModel")
const Order = require("../../models/orderModel")
const Return = require("../../models/returnProductsModel")
const Product = require("../../models/products")
const razorpay = require("../utils/razorpayConfig")
const Coupon = require("../../models/couponModel")


const orderProduct = async (req, res) => {

    try {

        const selectedPaymentOptions = req.body.paymentOptions;

        if (selectedPaymentOptions) {

            const userData = await User.findById(req.session.user_id).populate('cart.product');

            const selectAddress = await Address.findOne({ userId: req.session.user_id, default: true })

            const products = userData.cart.map((cartItem) => {
                return {
                    product: cartItem.product, // Product reference
                    quantity: cartItem.quantity, // Quantity
                    total: cartItem.total,
                };
            });

            const order = new Order({
                user: req.session.user_id,
                products: products,
                totalAmount: req.body.totalAmount,
                paymentMethod: selectedPaymentOptions,
                deliveryAddress: {
                    _id: selectAddress._id,
                    userId: userData._id,
                    name: selectAddress.name,
                    mobile: selectAddress.mobile,
                    country: selectAddress.country,
                    state: selectAddress.state,
                    district: selectAddress.district,
                    city: selectAddress.city,
                    pincode: selectAddress.pincode,
                    address: selectAddress.address
                }
            });

            // coupons
            const foundCoupon = await Coupon.findOne({
                isActive: true, minimumPurchaseAmount: { $lte: userData.totalCartAmount }
            }).sort({ minimumPurchaseAmount: -1 });

            if (foundCoupon) {
                const couponExists = userData.earnedCoupons.some((coupon) => coupon.coupon.equals(foundCoupon._id));
                if (!couponExists) {
                    userData.earnedCoupons.push({ coupon: foundCoupon._id });
                }
            }

            const currentUsedCoupon = await userData.earnedCoupons.find((coupon) => coupon.coupon.equals(req.body.currentCoupon));
            if (currentUsedCoupon) {
                currentUsedCoupon.isUsed = true;
                await Coupon.findByIdAndUpdate(req.body.currentCoupon, { $inc: { usedCount: 1 } });
            }


            if (selectedPaymentOptions === "Cash on delivery") {
                await order.save()
            } else if (selectedPaymentOptions === "Razorpay") {
                // Create a Razorpay order
                const razorpayOrder = await razorpay.orders.create({
                    amount: userData.totalCartAmount * 100, // Total amount in paise
                    currency: 'INR', // Currency code (change as needed)
                    receipt: `${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}${Date.now()}`, // Provide a unique receipt ID
                });

                // Save the order details to your database
                order.razorpayOrderId = razorpayOrder.id;

                // Redirect the user to the Razorpay checkout page
                return res.render("users/razorpay", {
                    order: razorpayOrder,
                    key_id: process.env.RAZORPAY_ID_KEY,
                    user: userData
                });
            } else {
                if (userData.wallet.balance < userData.totalCartAmount) {
                    const errorMessage = "Insufficient wallet balance";
                    return res.redirect(`/checkout?error=${encodeURIComponent(errorMessage)}`);
                } else {
                    await order.save()
                    userData.wallet.balance -= userData.totalCartAmount;
                    const transactionData = {
                        amount: userData.totalCartAmount,
                        description: 'Order placed.',
                        type: 'Debit',
                    };
                    userData.wallet.transactions.push(transactionData);
                    // stock update
                    for (let i = 0; i < userData.cart.length; i++) {

                        const changeStock = await Product.findById(userData.cart[i].product)

                        await Product.updateOne({ _id: changeStock._id }, { stock: changeStock.stock - userData.cart[i].quantity })

                    }

                    userData.cart = [];
                    userData.totalCartAmount = 0;
                }
            }


            if (selectedPaymentOptions === "Wallet") {
                // stock update
                for (let i = 0; i < userData.cart.length; i++) {

                    const changeStock = await Product.findById(userData.cart[i].product)

                    await Product.updateOne({ _id: changeStock._id }, { stock: changeStock.stock - userData.cart[i].quantity })

                }

                userData.cart = [];
                userData.totalCartAmount = 0;
            }

            if (selectedPaymentOptions === "Razorpay" || selectedPaymentOptions === "Cash on delivery") {
                // stock update
                for (let i = 0; i < userData.cart.length; i++) {

                    const changeStock = await Product.findById(userData.cart[i].product)

                    await Product.updateOne({ _id: changeStock._id }, { stock: changeStock.stock - userData.cart[i].quantity })

                }

                userData.cart = [];
                userData.totalCartAmount = 0;
            }

            await userData.save();
            res.redirect("/order")

        } else {
            const errorMessage = "Please select any payment option";
            res.redirect(`/checkout?error=${encodeURIComponent(errorMessage)}`);
        }

    } catch (error) {
        console.log(error.message);
    }
}

const saveRzpOrder = async (req, res) => {
    try {
        const { transactionId, orderId, signature } = req.body;
        const amount = parseInt(req.body.amount / 100);
        const currentUser = await User.findById(req.session.user_id).populate('cart.product');
        const deliveryAddress = await Address.findOne({ userId: req.session.user_id, default: true });
        if (transactionId && orderId && signature) {

            const orderedProducts = currentUser.cart.map((item) => {
                return {
                    product: item.product,
                    quantity: item.quantity,
                    total: item.total,
                }
            });

            let newOrder = new Order({
                user: req.session.user_id,
                products: orderedProducts,
                totalAmount: amount,
                paymentMethod: 'Razorpay',
                deliveryAddress,
            });

            await newOrder.save()

            // stock update
            for (let i = 0; i < currentUser.cart.length; i++) {
                const changeStock = await Product.findById(currentUser.cart[i].product)
                await Product.updateOne({ _id: changeStock._id }, { stock: changeStock.stock - currentUser.cart[i].quantity })
                await changeStock.save();
            }

            currentUser.cart = [];
            currentUser.totalCartAmount = 0;

            await currentUser.save();

            return res.status(200).json({
                message: "order placed successfully",
            });
        }
    } catch (error) {
        console.log(error.message);
    }
};

const loadOrder = async (req, res) => {
    try {

        const currentUser = await User.findById(req.session.user_id);
        const perPage = 5; // Number of orders per page
        const page = req.query.page || 1; // Get the current page from query parameters (default to page 1)

        const ordersCount = await Order.countDocuments({ user: req.session.user_id });
        const totalPages = Math.ceil(ordersCount / perPage);
        const orders = await Order.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(req.session.user_id) } },
            { $unwind: "$products" },
            {
                $lookup: {
                    from: "products",
                    localField: "products.product",
                    foreignField: "_id",
                    as: "orderedProducts"
                }
            },
            { $sort: { orderDate: -1 } },
            { $skip: (page - 1) * perPage }
        ]);

        res.render("users/order", {
            user: req.session.user_id,
            currentUser,
            orders,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        console.log(error.message);
    }
}

const getReturnProductForm = async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.user_id);
        const product = await Product.findById(req.query.product);
        const category = await Category.findById(req.query.category);
        const defaultAddress = await Address.findOne({ userId: req.session.user_id, default: true });
        res.render("users/returnForm", {
            user: req.session.user_id,
            currentUser,
            currentAddress: defaultAddress,
            order: req.query.order,
            category,
            product,
            quantity: req.query.quantity,
            totalPrice: req.query.totalPrice,
        });
    } catch (error) {
        console.log(error.message);
    }
};

const requestReturnProduct = async (req, res) => {
    try {
        const foundOrder = await Order.findById(req.body.order).populate('products.product');
        const foundProduct = await Product.findById(req.body.productId);
        const returnProduct = new Return({
            user: req.session.user_id,
            order: foundOrder._id,
            product: foundProduct._id,
            quantity: parseInt(req.body.quantity),
            totalPrice: parseInt(req.body.totalPrice),
            reason: req.body.reason,
            condition: req.body.condition,
            address: req.body.address
        });
        await returnProduct.save();

        foundOrder.products.forEach((product) => {
            if (product.product._id.toString() === foundProduct._id.toString()) {
                product.returnRequested = 'Pending';
            }
        });
        await foundOrder.save();

        res.redirect("/order");
    } catch (error) {
        console.log(error)
    }
};

const cancelOrder = async (req, res) => {
    try {
        const foundOrder = await Order.findById(req.body.orderId).populate('products.product');
        const foundProduct = foundOrder.products.find((product) => product.product._id.toString() === req.body.productId);
        if (foundOrder.paymentMethod !== 'Cash on delivery') {
            const currentUser = await User.findById(req.session.user_id);

            if (currentUser) { // Check if currentUser is defined
                const refundAmount = foundProduct.total;
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
        foundProduct.isCancelled = true;

        const EditProduct = await Product.findOne({ _id: foundProduct.product._id });

        const currentStock = EditProduct.stock;
        EditProduct.stock = currentStock + foundProduct.quantity;

        foundOrder.totalAmount -= foundProduct.total

        foundProduct.quantity = 0
        foundProduct.total = 0

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
        if (areAllProductsCancelled(foundOrder)) {
            // Update the order status to "Cancelled"

            foundOrder.totalAmount -= 0
            foundOrder.status = "Cancelled";
        }

        await foundOrder.save();
        res.redirect("/order");
    } catch (error) {
        console.log(error)
    }
};

const getWallet = async (req, res) => {
    try {
        // fix sorting
        const currentUser = await User.findById(req.session.user_id).sort({ 'wallet.transactions.timestamp': -1 });
        res.render("users/wallet", {
            user: req.session.user_id,
            currentUser,
        });
    } catch (error) {
        console.log(error)
    }
};

const getCoupons = async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.user_id).populate('earnedCoupons.coupon');
        const allCoupons = await Coupon.find({ isActive: true });
        const earnedCoupons = currentUser.earnedCoupons;

        // Convert the list of earned coupon IDs to an array
        const earnedCouponIds = earnedCoupons.map((coupon) => coupon.coupon._id.toString());
        // Filter out earned coupons from the active coupons list
        const remainingCoupons = allCoupons.filter((coupon) => !earnedCouponIds.includes(coupon._id.toString()));

        res.render("users/coupons", {
            user: req.session.user_id,
            currentUser,
            allCoupons: remainingCoupons,
            earnedCoupons,
        });
    } catch (error) {
        console.log(error);
    }
};

const applyCoupon = async (req, res) => {
    try {
        const userData = await User.findById(req.session.user_id).populate('earnedCoupons.coupon');
        await userData.populate('cart.product');
        await userData.populate('cart.product.category');
        const cartProducts = userData.cart;
        const selectAddress = await Address.findOne({ userId: req.session.user_id, default: true })
        const allAddress = await Address.find({ userId: req.session.user_id, default: false })
        const currentCoupon = await Coupon.findOne({ code: req.body.coupon });
        const grandTotal = cartProducts.reduce((total, element) => {
            return total + element.total;
        }, 0);
        let couponError = "";
        let discount = 0;
        const errorMessage = req.query.error;
        if (currentCoupon) {
            const foundCoupon = userData.earnedCoupons.find(coupon => coupon.coupon._id.equals(currentCoupon._id));
            if (foundCoupon) {
                if (foundCoupon.coupon.isActive) {
                    if (!foundCoupon.isUsed) {
                        if (foundCoupon.coupon.discountType === 'fixedAmount') {
                            console.log("here1");
                            console.log(foundCoupon.coupon.discountAmount);
                            discount = foundCoupon.coupon.discountAmount;
                        } else {
                            console.log("here2");
                            discount = (foundCoupon.coupon.discountAmount / 100) * grandTotal;
                        }
                    } else {
                        couponError = foundCoupon.isUsed ? "Coupon already used." : "Coupon is inactive.";
                    }
                } else {
                    couponError = foundCoupon.isUsed ? "Coupon already used." : "Coupon is inactive.";
                }
            } else {
                couponError = "Invalid coupon code.";
            }
        } else {
            couponError = "Invalid coupon code.";
        }

        res.render("users/checkout", {
            user: req.session.user_id,
            userData,
            cartProducts,
            selectAddress,
            allAddress,
            discount,
            grandTotal,
            currentCoupon: couponError ? '' : currentCoupon._id,
            couponError,
            errorMessage,
            error: "",
        });
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    orderProduct,
    saveRzpOrder,
    loadOrder,
    getReturnProductForm,
    requestReturnProduct,
    cancelOrder,
    getWallet,
    getCoupons,
    applyCoupon,
}
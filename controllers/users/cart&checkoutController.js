const mongoose = require('mongoose');
const User = require("../../models/usersModel")
const Address = require("../../models/addressModel")
const Product = require("../../models/products")


const loadShopingCart = async (req, res) => {

    try {

        const userData = await User.findById(req.session.user_id).populate('cart.product');

        res.render("users/cart", { user: req.session.user_id, userData })

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const addToCart = async (req, res) => {

    try {

        const productId = req.query.id

        const productData = await Product.findById(productId)
        const obj = {
            product: productData._id,
            quantity: 1,
            total: productData.price
        }

        const userData = await User.findById(req.session.user_id)

        const totalCartAmt = userData.totalCartAmount + productData.price

        await User.updateOne({ _id: req.session.user_id }, { $set: { totalCartAmount: totalCartAmt } })

        userData.cart.push(obj);
        await userData.save()

        res.redirect(`/productDetail?id=${productData._id}`)

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const updateCart = async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.user_id);
        const cartItem = currentUser.cart.find(item => item.product.equals(new mongoose.Types.ObjectId(req.params.id)));
        if (cartItem) {
            const product = await Product.findById(cartItem.product);

            if (req.body.type === "increment") {
                if ((cartItem.quantity + 1) > product.stock) {
                    return res.status(200).json({ message: "Stock limit exeeded" });
                } else {
                    cartItem.quantity++;
                }
            } else {
                if (cartItem.quantity !== 1) {
                    cartItem.quantity--;
                }
            }

            let insufficientStock = false;
            if (product.stock < cartItem.quantity) {
                insufficientStock = true
            }

            await currentUser.populate('cart.product');

            for (const item of currentUser.cart) {
                const currentProduct = await Product.findById(item.product);
                item.total = item.quantity * currentProduct.price;
            }

            const grandTotal = currentUser.cart.reduce((total, element) => {
                return total + (element.quantity * element.product.price);
            }, 0);

            currentUser.totalCartAmount = grandTotal;

            await currentUser.save();
            return res.status(200).json({
                message: "Success",
                quantity: cartItem.quantity,
                totalPrice: product.price * cartItem.quantity,
                grandTotal,
                stock: product.stock,
                insufficientStock,
            });
        } else {
            return res.status(404).json({ message: "Product not found in the user's cart." });
        }
    } catch (error) {
        res.render("error/internalError", { error })
    }
};

const deleteCart = async (req, res) => {

    try {

        const userData = await User.findById(req.session.user_id)

        const cartId = req.query.cartId

        const itemIndex = userData.cart.findIndex(item => item._id.toString() === cartId);

        userData.totalCartAmount -= userData.cart[itemIndex].total

        userData.cart.splice(itemIndex, 1);
        await userData.save();

        res.redirect("/shopingCart")

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const loadCheckout = async (req, res) => {

    try {

        const userData = await User.findById(req.session.user_id).populate('cart.product');

        const selectAddress = await Address.findOne({ userId: req.session.user_id, default: true })

        const allAddress = await Address.find({ userId: req.session.user_id, default: false })

        const errorMessage = req.query.error;

        res.render("users/checkout", { user: req.session.user_id, userData, selectAddress, allAddress, errorMessage, couponError:"", discount:0, currentCoupon:"" })

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const loadEditAddressCheckout = async (req, res) => {

    try {

        const id = req.query.id;

        const editAddress = await Address.findById(id)

        if (editAddress) {
            res.render("users/edit-Address-checkout", { user: req.session.user_id, editAddress })
        } else {
            res.redirect("/profile")
        }

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const EditAddressCheckout = async (req, res) => {

    try {

        const { name, mobile, country, state, district, city, pincode, address } = req.body

        // Validate mobile (10 digits)
        if (!/^\d{10}$/.test(mobile)) {
            const id = req.body.id;

            const editAddress = await Address.findById(id)
            return res.render("users/edit-Address-checkout", { user: req.session.user_id, error: "Mobile number should be 10 digits.", editAddress })
        }

        await Address.updateOne({ _id: req.body.id }, { $set: { name, mobile, country, state, district, city, pincode, address } })
        res.redirect("/checkout")

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const loadAddAddressCheckout = async (req, res) => {

    try {

        res.render("users/addAdress-checkout", { user: req.session.user_id })

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const AddAddressCheckout = async (req, res) => {

    try {
        const { name, mobile, country, state, district, city, pincode, address } = req.body

        // Validate mobile (10 digits)
        if (!/^\d{10}$/.test(mobile)) {
            return res.render("users/addAdress", { user: req.session.user_id, error: "Mobile number should be 10 digits." })
        }

        const check = await Address.find({ userId: req.session.user_id })

        if (check.length > 0) {
            const addAddress = new Address({
                userId: req.session.user_id, name, mobile, country, state, district, city, pincode, address
            });
            addAddress.save()
        } else {
            const addAddress = new Address({
                userId: req.session.user_id, name, mobile, country, state, district, city, pincode, address, default: true
            });
            addAddress.save()
        }

        res.redirect("/checkout")

    } catch (error) {
        res.render("error/internalError", { error })
    }
}

const selectAddress = async (req, res) => {

    try {

        console.log(req.query.id);

        await Address.updateOne({ userId: req.session.user_id, default: true }, { default: false })

        await Address.updateOne({ _id: req.query.id }, { default: true })

        res.redirect("/checkout")

    } catch (error) {
        res.render("error/internalError", { error })
    }
}

module.exports = {
    loadShopingCart,
    addToCart,
    updateCart,
    deleteCart,
    loadCheckout,
    loadEditAddressCheckout,
    EditAddressCheckout,
    loadAddAddressCheckout,
    AddAddressCheckout,
    selectAddress,
}
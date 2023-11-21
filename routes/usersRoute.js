const express = require("express")
const usersRoute = express()

const auth = require("../middleware/auth")

const middlewares = require('../middleware/imageUpload')

const bodyParser = require("body-parser")

usersRoute.use(bodyParser.json())
usersRoute.use(bodyParser.urlencoded({ extended: true }))

usersRoute.set("view engine", "ejs")

// controllers require
const mainController = require("../controllers/users/mainController")
const loginSignupController = require("../controllers/users/login&signupController")
const profileController = require("../controllers/users/profileController")
const cartCheckoutController = require("../controllers/users/cart&checkoutController")
const orderController = require("../controllers/users/orderController")


usersRoute.get("/", mainController.loadHome)

usersRoute.get("/home", mainController.loadHome)

usersRoute.get("/shop", mainController.loadShop)

usersRoute.get("/productDetail", mainController.loadProductDetail)

usersRoute.get("/about", mainController.loadAbout)

usersRoute.get("/contact", mainController.loadContact)

// signup , otp , login

usersRoute.get("/signup", auth.isLogout, loginSignupController.loadSignup)

usersRoute.post("/signup", auth.isLogout, loginSignupController.insertUsers)

usersRoute.post("/verifyOTP", auth.isLogout, loginSignupController.verifyOTPSignup)

usersRoute.get("/verifyOTP", auth.isLogout, loginSignupController.loadOTPpage)

usersRoute.get("/resendOTPSignup",auth.isLogout, loginSignupController.resendOTPSignup)

usersRoute.get("/login", auth.isLogout, loginSignupController.loadLogin)

usersRoute.post("/login", auth.isLogout, loginSignupController.verifyLogin)

usersRoute.get("/forgot-password", auth.isLogout, loginSignupController.loadForgetPass)

usersRoute.post("/forgot-password", auth.isLogout, loginSignupController.loadOTPForgetPass)

usersRoute.get("/verifyOTPForgetPass", auth.isLogout, loginSignupController.loadOTPForgetPassPage)

usersRoute.post("/verifyOTPForgetPass", auth.isLogout, loginSignupController.verifyOTPForgetPassPage)

usersRoute.post("/changePass", auth.isLogout, loginSignupController.changePass)

usersRoute.get("/verify-account", auth.isLogout, loginSignupController.loadVerifyAc)

usersRoute.post("/verify-account", auth.isLogout, loginSignupController.loadOTPVerifyAc)

usersRoute.get("/verifyOTPVerifyAc", auth.isLogout, loginSignupController.loadOTPVerifyAcPage)

usersRoute.post("/verifyOTPVerifyAc", auth.isLogout, loginSignupController.verifyOTPVerifyAcPage)



// profile

usersRoute.get("/profile", auth.isLogin, profileController.loadProfile)

usersRoute.patch('/profile/editPhoto', auth.isLogin, middlewares.uploadProfileImage, middlewares.resizeProfileImage, profileController.updateProfilePhoto)

usersRoute.get("/profile/deletePhoto", auth.isLogin, profileController.deleteProfilePhoto)

usersRoute.get("/edit-profile", auth.isLogin, profileController.loadEditProfile)

usersRoute.post("/edit-profile", auth.isLogin, profileController.EditProfile)

usersRoute.get("/verifyChangeMail", auth.isLogin, profileController.loadOTPChangeMail)

usersRoute.post("/verifyChangeMail", auth.isLogin, profileController.verifyOTPChangeMail)

usersRoute.get("/logout", auth.isLogin, loginSignupController.userLogout)

// change password

usersRoute.get("/change-password", auth.isLogin, profileController.loadChangePass)

usersRoute.post("/change-password", auth.isLogin, profileController.ChangePass)


// Address

usersRoute.get("/add-address", auth.isLogin, profileController.loadAddAddress)

usersRoute.post("/add-address", auth.isLogin, profileController.AddAddress)

usersRoute.get("/delete-address", auth.isLogin, profileController.deleteAddress)

usersRoute.get("/edit-address", auth.isLogin, profileController.loadEditAddress)

usersRoute.post("/edit-address", auth.isLogin, profileController.EditAddress)

// Whishlist

usersRoute.get("/addWhishlist", auth.isLogin, mainController.addToWhishlist)

usersRoute.get("/wishlist", auth.isLogin, mainController.loadWishlist)

usersRoute.get("/delete-whishlist", auth.isLogin, mainController.deleteWhishlist)

// Cart

usersRoute.get("/addToCart", auth.isLogin, cartCheckoutController.addToCart)

usersRoute.post("/update-cart/:id", auth.isLogin, cartCheckoutController.updateCart)

usersRoute.get("/shopingCart", auth.isLogin, cartCheckoutController.loadShopingCart)

usersRoute.get("/delete-cart", auth.isLogin, cartCheckoutController.deleteCart)

// Checkout

usersRoute.get("/checkout", auth.isLogin, cartCheckoutController.loadCheckout)

usersRoute.get("/edit-address-checkout", auth.isLogin, cartCheckoutController.loadEditAddressCheckout)

usersRoute.post("/edit-address-checkout", auth.isLogin, cartCheckoutController.EditAddressCheckout)

usersRoute.get("/add-address-checkout", auth.isLogin, cartCheckoutController.loadAddAddressCheckout)

usersRoute.post("/add-address-checkout", auth.isLogin, cartCheckoutController.AddAddressCheckout)

usersRoute.get("/select-address", auth.isLogin, cartCheckoutController.selectAddress)

// Order

usersRoute.post("/order-product", auth.isLogin, orderController.orderProduct)

usersRoute.post("/save-rzporder", auth.isLogin, orderController.saveRzpOrder)

usersRoute.get("/order", auth.isLogin, orderController.loadOrder)

usersRoute.get("/return-product", auth.isLogin, orderController.getReturnProductForm)

usersRoute.post("/return-product", auth.isLogin, orderController.requestReturnProduct)

// Wallet

usersRoute.get("/wallet", auth.isLogin, orderController.getWallet)

// Coupons

usersRoute.get("/coupons", auth.isLogin, orderController.getCoupons)

usersRoute.post("/apply-coupon", auth.isLogin, orderController.applyCoupon)

// Review

usersRoute.post("/submitReview", auth.isLogin, orderController.submitReview)

usersRoute.get("/cancel-order", auth.isLogin, orderController.getCancelProductForm)

usersRoute.post("/cancel-order", auth.isLogin, orderController.requestCancelProduct)


usersRoute.use((req, res) => {
    res.render('users/404')
})

module.exports = usersRoute;
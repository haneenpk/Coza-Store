const express = require("express")
const adminRoute = express()

const bodyParser = require("body-parser")
adminRoute.use(bodyParser.json())
adminRoute.use(bodyParser.urlencoded({extended:true}))

adminRoute.set("view engine","ejs")

const auth = require("../middleware/adminAuth")
const Imagemiddleware = require('../middleware/imageUpload')

// controllers require
const loginSignupController = require("../controllers/admin/login&signupController")
const mainController = require("../controllers/admin/mainController")
const userslistController = require("../controllers/admin/userslistController")
const categoryController = require("../controllers/admin/categoryController")
const productController = require("../controllers/admin/productController")
const orderController = require("../controllers/admin/orderController")
const couponsController = require("../controllers/admin/couponsController")
const bannerController = require("../controllers/admin/bannerController")


// login admin

adminRoute.get("/",auth.isLogin,mainController.loadDashboard)

adminRoute.get("/login",auth.isLogout,loginSignupController.loadLogin)

adminRoute.post("/login",loginSignupController.verifyLogin)

adminRoute.get("/logout",auth.isLogin,loginSignupController.logout)

adminRoute.get("/dashboard",auth.isLogin,mainController.loadDashboard)

// Sales Repot

adminRoute.get("/sales-report",auth.isLogin,mainController.loadSalesReport)

adminRoute.post("/sales-report",auth.isLogin,mainController.loadSalesReport)

adminRoute.get("/download-report",auth.isLogin,mainController.downloadSalesReport);

// Category

adminRoute.get("/category",auth.isLogin,categoryController.loadCategory)

adminRoute.get("/add-category",auth.isLogin,categoryController.loadAddCategory)

adminRoute.post("/add-category",auth.isLogin,categoryController.AddCategory)

adminRoute.get("/edit-category",auth.isLogin,categoryController.loadEditCategory)

adminRoute.post("/edit-category",auth.isLogin,categoryController.EditCategory)

adminRoute.get("/delete-category",auth.isLogin,categoryController.deleteCategory)

// Category End

// Product

adminRoute.get("/product",auth.isLogin,productController.middlewareProduct,productController.loadProduct)

adminRoute.get("/add-product",auth.isLogin,productController.loadAddProduct)

adminRoute.post("/add-product",auth.isLogin,  Imagemiddleware.uploadProductImages, Imagemiddleware.resizeProductImages,productController.AddProduct)

adminRoute.get("/delete-product",auth.isLogin,productController.deleteProduct)

adminRoute.get("/edit-product",auth.isLogin,productController.loadEditProduct)

adminRoute.post("/edit-product",auth.isLogin,productController.EditProduct)

adminRoute.delete("/products/:id/img/delete",auth.isLogin,productController.destroyProductImage)

adminRoute.patch("/products/:id/img/add",auth.isLogin,Imagemiddleware.uploadProductImages, Imagemiddleware.resizeProductImages, productController.updateProductImages)

// Product End

// Order

adminRoute.get("/order",auth.isLogin,orderController.loadOrder)

adminRoute.get("/order/action-update", auth.isLogin, orderController.updateActionOrder)

adminRoute.get("/return-requests", auth.isLogin, orderController.getReturnRequests)

adminRoute.post("/return-requests", auth.isLogin, orderController.returnRequestAction)

adminRoute.get("/cancel-requests", auth.isLogin, orderController.getCancelRequests)

adminRoute.post("/cancel-requests", auth.isLogin, orderController.returnCancelAction)

// Order End

// Users

adminRoute.get("/users",auth.isLogin,userslistController.loadUsers)

adminRoute.get("/block-user",auth.isLogin,userslistController.blockUser)

adminRoute.get("/unblock-user",auth.isLogin,userslistController.unblockUser)

// Users End

// Coupons

adminRoute.get("/coupons",auth.isLogin,couponsController.loadCoupons)

adminRoute.get("/new-coupon",auth.isLogin,couponsController.getAddNewCoupon)

adminRoute.post("/new-coupon",auth.isLogin,couponsController.addNewCoupon)

adminRoute.patch("/coupons/action/:id",auth.isLogin,couponsController.couponAction)

// Coupons End

// Banner

adminRoute.get("/banner",auth.isLogin,bannerController.middlewareBanner,bannerController.loadBanner)

adminRoute.get("/add-banner",auth.isLogin,bannerController.loadAddBanner)

adminRoute.post("/add-banner",auth.isLogin, Imagemiddleware.uploadBannerImage, Imagemiddleware.resizeBannerImage,bannerController.AddBanner)

adminRoute.get("/delete-banner",auth.isLogin,bannerController.deleteBanner)

adminRoute.get("/edit-banner",auth.isLogin,bannerController.loadEditBanner)

adminRoute.post("/edit-banner",auth.isLogin,bannerController.EditBanner)

adminRoute.get("/deletePhoto-banner", auth.isLogin, bannerController.destroyBannerImage)

adminRoute.patch('/uploadPhoto-banner',auth.isLogin, Imagemiddleware.uploadBannerImage, Imagemiddleware.resizeBannerImage,bannerController.uploadBannerImage)



adminRoute.get("*",mainController.error)

module.exports = adminRoute;
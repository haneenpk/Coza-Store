const Coupon = require("../../models/couponModel.js")


const loadCoupons = async (req, res) => {
    try {
        // pagination
        const page = req.query.page || 1;
        const pageSize = 8;
        const skip = (page - 1) * pageSize;
        const totalCoupons = await Coupon.countDocuments();
        const totalPages = Math.ceil(totalCoupons / pageSize);

        let foundCoupons;

        if (req.query.search) {
            foundCoupons = await Coupon.find({
                isActive: req.body.searchQuery === "1" ? true : false
            });
            return res.status(200).json({
                couponDatas: foundCoupons,
            });
        } else {
            foundCoupons = await Coupon.find().skip(skip).limit(pageSize);
            res.render('admin/coupons', {
                activePage: "coupon",
                foundCoupons,
                filtered: req.query.search ? true : false,
                currentPage: page || 1,
                totalPages: totalPages || 1,
            });
        }
    } catch (error) {
        res.render("error/internalError", { error })
    }
};

const getAddNewCoupon = (req, res) => {
    try {
        res.render('admin/newCoupon',{ activePage: "coupon", error:"" });
    } catch (error) {
        res.render("error/internalError", { error })
    }  
};

function generateCouponCode() {
    const codeRegex = /^[A-Z0-9]{5,15}$/;
    let code = '';
    while (!codeRegex.test(code)) {
        code = Math.random().toString(36).substring(7);
    }
    return Coupon.findOne({ code }).then(existingCoupon => {
        if (existingCoupon) {
            return generateCouponCode();
        }
        return code;
    });
}

const addNewCoupon = async (req, res, next) => {
    try {
        const { description, discountType, discountAmount, minimumPurchaseAmount, usageLimit } = req.body;
        if (!description || !discountType || !discountAmount || !minimumPurchaseAmount || !usageLimit) {
            res.render('admin/newCoupon', {
                activePage: "coupon",
                error: "All fields are required",
            });
        } else {
            if (description.length < 4 || description.length > 100) {
                return res.render('admin/newCoupon', {
                    activePage: "coupon",
                    error: "Description must be between 4 and 100 characters",
                });
            } else {
                const uniqueCode = await generateCouponCode();
                const newCoupon = new Coupon({
                    code: uniqueCode,
                    discountType,
                    description,
                    discountAmount,
                    minimumPurchaseAmount,
                    usageLimit,
                });

                await newCoupon.save();

                res.redirect("/admin/coupons");
            }
        }
    } catch (error) {
        res.render("error/internalError", { error })
    }
};

const couponAction = async (req, res, next) => {
    try {
        const state = req.body.state === "";
        const couponId = req.params.id;
        await Coupon.findByIdAndUpdate(couponId, { $set: { isActive: state } });
        res.redirect('/admin/coupons');
    } catch (error) {
        res.render("error/internalError", { error })
    }
};

module.exports = {
    loadCoupons,
    getAddNewCoupon,
    addNewCoupon,
    couponAction,
}
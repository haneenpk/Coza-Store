const Category = require("../../models/category")
const Banner = require("../../models/bannerModel")


const middlewareBanner = async (req, res, next) => {
    try {
        const categories = await Category.find();

        res.locals.categories = categories;
        
        next();
    } catch (error) {
        res.render("error/internalError", { error })
    }
}

const loadBanner = async (req, res) => {
    const { query, category } = req.query;
    const perPage = 8; // Number of products per page
    const page = req.query.page || 1; // Get the current page from query parameters (default to page 1)

    try {
        let banners;
        let totalBanners;
        let filter = {};

        if (query) {
            filter.name = { $regex: `\\b${query}\\b`, $options: 'i' };
        }

        if (category) {
            filter.category = category;
        }

        banners = await Banner.find(filter)
            .populate('category')
            .skip((page - 1) * perPage) // Skip products on previous pages
            .limit(perPage); // Limit the number of products per page

        totalBanners = await Banner.countDocuments(filter);

        const totalPages = Math.ceil(totalBanners / perPage);

        res.render("admin/banner", {
            activePage: "banner",
            banners,
            totalPages,
            currentPage: page,
        });
    } catch (error) {
        res.render("error/internalError", { error })
    }
};

const loadAddBanner = async (req, res) => {

    try {

        const categories = await Category.find();
        if (categories) {
            res.render("./admin/add-banner", { activePage: "banner", categories })
        } else {
            res.render("./admin/add-banner", { activePage: "banner" })
        }

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const AddBanner = async (req, res) => {

    try {

        const categories = await Category.find();
        if (!req.body.name) {
            return res.render("./admin/add-banner", { activePage: "banner", categories, error: "Name should be filled" })
        }

        if (!req.body.title) {
            return res.render("./admin/add-banner", { activePage: "banner", categories, error: "Title should be filled" })
        }

        const existingBanner = await Banner.findOne({ title: req.body.title })

        if (existingBanner) return res.render("./admin/add-banner", { activePage: "banner", categories, error: "This title already existed" })

        const bannerData = new Banner({
            name: req.body.name,
            title: req.body.title,
            category: req.body.category, // Category ID from the form
            image: req.body.image,
        })

        await bannerData.save()

        if (bannerData) {
            res.render("./admin/add-banner", { activePage: "banner", categories, message: "Banner added" })
        } else {
            res.render("./admin/add-banner", { activePage: "banner", categories, error: "Banner not added try again" })
        }


    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const deleteBanner = async (req, res) => {

    try {

        await Banner.findByIdAndDelete({ _id: req.query.id });

        res.redirect("/admin/banner")

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const loadEditBanner = async (req, res) => {

    try {

        const categories = await Category.find();

        const id = req.query.id;

        const bannerData = await Banner.findById(id).populate('category')
        if (bannerData) {
            res.render("./admin/edit-banner", { activePage: "banner", banners: bannerData, categories })
        } else {
            res.redirect("./admin/edit-banner")
        }

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const EditBanner = async (req, res) => {

    try {

        await Banner.updateOne({ _id: req.body.id }, { $set: { name: req.body.name, title: req.body.title, category: req.body.category } })
        res.redirect("/admin/banner")

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const destroyBannerImage = async (req, res) => {

    try {

        await Banner.updateOne({ _id: req.query.id }, { $set: { image: "" } })

        res.redirect(`/admin/edit-banner?id=${req.query.id}`)
    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const uploadBannerImage = async (req, res) => {

    try {

        await Banner.updateOne({ _id: req.query.id }, { $set: { image: req.body.image } })

        res.redirect(`/admin/edit-banner?id=${req.query.id}`)
    } catch (error) {
        res.render("error/internalError", { error })
    }

}


module.exports = {
    middlewareBanner,
    loadBanner,
    loadAddBanner,
    AddBanner,
    deleteBanner,
    loadEditBanner,
    EditBanner,
    destroyBannerImage,
    uploadBannerImage,
}
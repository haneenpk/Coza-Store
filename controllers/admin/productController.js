const Category = require("../../models/category")
const Product = require("../../models/products")
const fs = require("fs")
const path = require("path")


const middlewareProduct = async (req, res, next) => {
    try {
        const categories = await Category.find();
        const brands = await Product.distinct('brand');

        res.locals.categories = categories;
        res.locals.brands = brands;
        next();
    } catch (error) {
        res.render("error/internalError", { error })
    }
}

const loadProduct = async (req, res) => {
    const { query, category, brand } = req.query;
    const perPage = 8; // Number of products per page
    const page = req.query.page || 1; // Get the current page from query parameters (default to page 1)

    try {
        let products;
        let totalProducts;
        let filter = {};

        if (query) {
            filter.name = { $regex: `\\b${query}\\b`, $options: 'i' };
        }

        if (category) {
            filter.category = category;
        }

        if (brand) {
            filter.brand = brand;
        }

        products = await Product.find(filter)
            .populate('category')
            .skip((page - 1) * perPage) // Skip products on previous pages
            .limit(perPage); // Limit the number of products per page

        totalProducts = await Product.countDocuments(filter);

        const totalPages = Math.ceil(totalProducts / perPage);

        res.render("admin/product", {
            activePage: "product",
            products,
            totalPages,
            currentPage: page,
        });
    } catch (error) {
        res.render("error/internalError", { error })
    }
};

const loadAddProduct = async (req, res) => {

    try {

        const categories = await Category.find();
        if (categories) {
            res.render("./admin/add-product", { activePage: "product", categories })
        } else {
            res.render("./admin/add-product", { activePage: "product" })
        }

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const AddProduct = async (req, res) => {

    try {

        const categories = await Category.find();
        if (!req.body.name) {
            return res.render("./admin/add-product", { activePage: "product", categories, error: "Product name should be filled" })
        }

        const existingProduct = await Category.findOne({ name: req.body.name })

        if (existingProduct) return res.render("./admin/add-product", { activePage: "product", categories, error: "Product name already existed" })

        if (!req.body.price) {
            return res.render("./admin/add-product", { activePage: "product", categories, error: "Price should be filled" })
        }

        if (!req.body.description) {
            return res.render("./admin/add-product", { activePage: "product", categories, error: "Description should be filled" })
        }

        const imagesWithPath = req.body.images.map(img => '/products/' + img)

        const productData = new Product({
            name: req.body.name,
            price: req.body.price,
            description: req.body.description,
            stock: req.body.stock,
            brand: req.body.brand,
            category: req.body.category, // Category ID from the form
            images: imagesWithPath,
        })

        await productData.save()

        if (productData) {
            res.render("./admin/add-product", { activePage: "product", categories, message: "Product added" })
        } else {
            res.render("./admin/add-product", { activePage: "product", categories, error: "Product not added try again" })
        }


    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const deleteProduct = async (req, res) => {

    try {

        await Product.findByIdAndDelete({ _id: req.query.id });

        res.redirect("/admin/product")

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const loadEditProduct = async (req, res) => {

    try {

        const categories = await Category.find();

        const id = req.query.id;

        const productData = await Product.findById(id).populate('category')
        if (productData) {
            res.render("./admin/edit-product", { activePage: "product", products: productData, categories })
        } else {
            res.redirect("./admin/edit-product")
        }

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const destroyProductImage = async (req, res) => {
    const { id } = req.params
    const { image } = req.body
    try {
        await Product.findByIdAndUpdate(id, { $pull: { images: image } }, { new: true })

        fs.unlink(path.join(__dirname, '../public', image), (err) => {
            if (err) console.log(err)
        })

        res.redirect(`/admin/edit-product?id=${id}`)

    } catch (error) {
        res.render("error/internalError", { error })
    }
}

const updateProductImages = async (req, res) => {
    const { id } = req.params
    const { images } = req.body
    let imagesWithPath
    if (images.length) {
        imagesWithPath = images.map(image => '/products/' + image)
    }
    try {
        await Product.findByIdAndUpdate(id, { $push: { images: imagesWithPath } }, { new: true })
        res.redirect(`/admin/edit-product?id=${id}`)
    } catch (error) {
        res.render("error/internalError", { error })
    }
}

const EditProduct = async (req, res) => {

    try {

        await Product.updateOne({ _id: req.body.id }, { $set: { name: req.body.name, price: req.body.price, description: req.body.description, brand: req.body.brand, stock: req.body.stock, category: req.body.category } })
        res.redirect("/admin/product")

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

module.exports = {
    middlewareProduct,
    loadProduct,
    deleteProduct,
    loadAddProduct,
    AddProduct,
    loadEditProduct,
    destroyProductImage,
    updateProductImages,
    EditProduct,
}
const Category = require("../../models/category")
const Product = require("../../models/products")


const loadCategory = async (req, res) => {
    const { query } = req.query;
    const perPage = 8; // Number of categories per page
    const page = req.query.page || 1; // Get the current page from query parameters (default to page 1)

    try {
        let category;
        let totalCategories;

        if (query) {
            category = await Category.find({ name: { $regex: `\\b${query}\\b`, $options: 'i' } })
                .skip((page - 1) * perPage) // Skip categories on previous pages
                .limit(perPage); // Limit the number of categories per page

            totalCategories = await Category.countDocuments({ name: { $regex: `\\b${query}\\b`, $options: 'i' } });
        } else {
            category = await Category.find()
                .skip((page - 1) * perPage) // Skip categories on previous pages
                .limit(perPage); // Limit the number of categories per page

            totalCategories = await Category.countDocuments();
        }

        const totalPages = Math.ceil(totalCategories / perPage);

        res.render("admin/category", {
            category,
            totalPages,
            currentPage: page,
            query,
        });
    } catch (error) {
        console.log(error.message);
    }
};

const loadAddCategory = async (req, res) => {

    try {
        res.render("./admin/add-category")
    } catch (error) {
        console.log(error.message);
    }

}

const AddCategory = async (req, res) => {

    try {

        if (!req.body.name) {
            return res.render("./admin/add-category", { error: "Category name should be filled" })
        }

        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(req.body.name, 'i') } });

        if (existingCategory) {
            return res.render("./admin/add-category", { error: "This Category already exists" });
        }

        const category = await Category.create({
            name: req.body.name
        });

        if (category) {
            res.render("./admin/add-category", { message: "Category added susseccfully" })
        } else {
            res.render("./admin/add-category", { error: "Category has been failed" })
        }

    } catch (error) {
        console.log(error.message);
    }

}

const loadEditCategory = async (req, res) => {

    try {
        const id = req.query.id;

        const categoryData = await Category.findById(id);
        if (categoryData) {
            res.render("./admin/edit-category", { category: categoryData })
        } else {
            res.redirect("./admin/category")
        }

    } catch (error) {
        console.log(error.message);
    }

}

const EditCategory = async (req, res) => {

    try {

        await Category.updateOne({ _id: req.body.id }, { $set: { name: req.body.name } })
        res.redirect("/admin/category")

    } catch (error) {
        console.log(error.message);
    }

}

const deleteCategory = async (req, res) => {

    try {

        const products = await Product.find({ category: req.query.id })

        console.log(products);

        for (let i = 0; i < products.length; i++) {
            products[i].category = null;
            await products[i].save();
        }

        await Category.findByIdAndDelete({ _id: req.query.id });

        res.redirect("/admin/category")

    } catch (error) {
        console.log(error.message);
    }

}

module.exports = {
    loadCategory,
    loadAddCategory,
    AddCategory,
    loadEditCategory,
    EditCategory,
    deleteCategory,
}
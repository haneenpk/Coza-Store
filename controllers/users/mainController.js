const mongoose = require('mongoose');
const User = require("../../models/usersModel")
const Product = require("../../models/products")
const Category = require("../../models/category")


const loadHome = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const productsPerPage = 8;

  try {
    const { query, category } = req.query;
    let queryFilters = {};

    if (query) {
      queryFilters.name = { $regex: `\\b${query}\\b`, $options: 'i' };
    }

    if (category) {
      queryFilters.category = category;
    }

    const products = await Product.find(queryFilters)
      .skip((page - 1) * productsPerPage)
      .limit(productsPerPage)
      .populate('category');

    const totalProducts = await Product.countDocuments(queryFilters);
    const categories = await Category.find();

    res.render('users/index', {
      products,
      user: req.session.user_id,
      totalPages: Math.ceil(totalProducts / productsPerPage),
      currentPage: page,
      searchQuery: query,
      selectedCategory: category, // Pass selected category to highlight in the dropdown
      categories,
    });
  } catch (error) {
    console.error(error.message);
  }
};

const loadShop = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const productsPerPage = 8;

  try {
    const { query, category } = req.query;
    let queryFilters = {};

    if (query) {
      queryFilters.name = { $regex: `\\b${query}\\b`, $options: 'i' };
    }

    if (category) {
      queryFilters.category = category;
    }

    const products = await Product.find(queryFilters)
      .skip((page - 1) * productsPerPage)
      .limit(productsPerPage)
      .populate('category');

    const totalProducts = await Product.countDocuments(queryFilters);
    const categories = await Category.find();

    res.render('users/shop', {
      products,
      user: req.session.user_id,
      totalPages: Math.ceil(totalProducts / productsPerPage),
      currentPage: page,
      searchQuery: query,
      selectedCategory: category, // Pass selected category to highlight in the dropdown
      categories,
    });
  } catch (error) {
    console.error(error.message);
  }
};

const loadAbout = async (req, res) => {

    try {

        res.render("users/about", { user: req.session.user_id })

    } catch (error) {
        console.log(error.message);
    }

}

const loadContact = async (req, res) => {

    try {

        res.render("users/contact", { user: req.session.user_id })

    } catch (error) {
        console.log(error.message);
    }

}

const loadProductDetail = async (req, res) => {

    try {

        const userId = req.session.user_id

        const productIdToCheck = req.query.id;

        const check = await User.findOne(
            {
                _id: userId,
                cart: { $elemMatch: { product: productIdToCheck } },
            }
        )

        const productData = await Product.findById(productIdToCheck)

        if (check) {
            res.render("./users/product-detail", { products: productData, user: req.session.user_id, message: "already exist in a cart" })
        } else {
            res.render("./users/product-detail", { products: productData, user: req.session.user_id, message: "" })
        }

    } catch (error) {
        console.log(error.message);
    }

}

const addToWhishlist = async (req, res) => {

    try {

        const userId = req.session.user_id;

        const productId = req.query.id;

        const user = await User.findOne({ _id: userId });

        // Check if the product is already in the wishlist
        if (user.wishlist.includes(productId)) {
            // Product is already in the wishlist, remove it first
            const indexToRemove = user.wishlist.indexOf(productId);
            user.wishlist.splice(indexToRemove, 1);
        }

        // Add the product to the wishlist
        user.wishlist.push(productId);

        // Save the user document to update the wishlist
        await user.save();

        // Redirect the user to the product detail page
        res.redirect(`/productDetail?id=${productId}`);

    } catch (error) {
        console.log(error.message);
    }

}

const loadWishlist = async (req, res) => {
    try {
        const perPage = 5; // Number of wishlist items per page
        const page = req.query.page || 1; // Get the current page from query parameters (default to page 1)

        const userData = await User.findById(req.session.user_id).populate('wishlist');
        const wishlistItems = userData.wishlist;
        const totalWishlistItems = wishlistItems.length;

        const totalPages = Math.ceil(totalWishlistItems / perPage);

        // Slice the wishlist items based on the current page and perPage
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        const displayedWishlistItems = wishlistItems.slice(startIndex, endIndex);

        res.render("users/wishlist", {
            user: req.session.user_id,
            userData,
            totalPages,
            currentPage: page,
            displayedWishlistItems,
        });
    } catch (error) {
        console.log(error.message);
    }
};

const deleteWhishlist = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productIdToDelete = req.query.productId;

    // Find the user by ID
    const user = await User.findById(userId);

    // Check if the product to delete exists in the wishlist
    const indexToRemove = user.wishlist.indexOf(productIdToDelete);
    if (indexToRemove !== -1) {
      // Remove the product from the wishlist
      user.wishlist.splice(indexToRemove, 1);

      // Save the user document to update the wishlist
      await user.save();
    }

    // Redirect the user back to their wishlist page or another appropriate page
    res.redirect("/wishlist");
  } catch (error) {
    console.log(error.message);
}
}

module.exports = {
    loadHome,
    loadShop,
    loadAbout,
    loadContact,
    loadProductDetail,
    loadWishlist,
    addToWhishlist,
    deleteWhishlist,
}
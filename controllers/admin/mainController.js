const User = require("../../models/usersModel")
const Category = require("../../models/category")
const Product = require("../../models/products")
const Order = require("../../models/orderModel")
const bcrypt = require("bcrypt")
const fs = require("fs")
const path = require("path")


const loadDashboard = async (req, res) => {

        try {
            res.render("./admin/index",{ activePage: "dashboard" })

        } catch (error) {
            res.render("error/internalError", { error })
        }

    }

const error = async (req, res) => {

    try {
        res.render("admin/404")
    } catch (error) {
        res.render("error/internalError", { error })
    }

}

module.exports = {
    loadDashboard,
    error
}
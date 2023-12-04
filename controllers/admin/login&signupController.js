const Admin = require("../../models/adminModel")


const loadLogin = async (req, res) => {

    try {
        res.render("./admin/login")

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const verifyLogin = async (req, res) => {

    try {

        const username = req.body.name
        const password = req.body.password

        const adminData = await Admin.findOne({ name: username })

        if (adminData) {

            if (password === adminData.password) {
                req.session.adminid = adminData.id;
                res.redirect("/admin/dashboard")
            } else {
                res.render("admin/login", { message: "Username and password is incorrect" })
            }

        } else {
            res.render("admin/login", { message: "Username and password is incorrect" })
        }

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const logout = async (req, res) => {

    try {

        req.session.destroy()
        res.redirect("/admin")

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

module.exports = {
    loadLogin,
    verifyLogin,
    logout,
}
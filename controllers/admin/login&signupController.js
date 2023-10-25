const User = require("../../models/usersModel")
const bcrypt = require("bcrypt")


const loadLogin = async (req, res) => {

    try {
        res.render("./admin/login")

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const verifyLogin = async (req, res) => {

    try {

        const username = req.body.username
        const password = req.body.password

        const userData = await User.findOne({ username: username })

        if (userData) {

            const passwordMatch = await bcrypt.compare(password, userData.password)

            if (passwordMatch) {

                if (userData.is_admin === 0) {
                    res.render("admin/login", { message: "Username and password is incorrect" })
                } else {
                    req.session.userid = userData.id;
                    res.redirect("/admin/dashboard")
                }

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
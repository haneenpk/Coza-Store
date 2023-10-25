const mongoose = require('mongoose');
const User = require("../../models/usersModel")
const Address = require("../../models/addressModel")

const bcrypt = require("bcrypt")

const loadProfile = async (req, res) => {

    try {

        const userProfile = await User.findById(req.session.user_id)
        const userAddress = await Address.find({ userId: req.session.user_id })

        res.render("users/profile", { user: req.session.user_id, userProfile, userAddress })

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const loadEditProfile = async (req, res) => {

    try {

        const userProfile = await User.findById(req.query.id)

        res.render("users/edit-profile", { user: req.session.user_id, userProfile })

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const updateProfilePhoto = async (req, res) => {

    try {

        await User.updateOne({ _id: req.session.user_id }, { $set: { profile: req.body.image } })

        res.redirect("/profile")
    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const deleteProfilePhoto = async (req, res) => {

    try {

        await User.updateOne({ _id: req.session.user_id }, { $set: { profile: "" } })

        res.redirect("/profile")
    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const EditProfile = async (req, res) => {

    try {

        const { id, username, email, mobile } = req.body;
        const userData = await User.findById(id)

        if (userData) {

            // Validate email
            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!emailRegex.test(email)) {
                return res.render("users/edit-profile", {
                    user: req.session.user_id,
                    userProfile: userData,
                    error: "Invalid email address.",
                });
            }

            // Validate mobile (10 digits)
            if (!/^\d{10}$/.test(mobile)) {
                return res.render("users/edit-profile", {
                    user: req.session.user_id,
                    userProfile: userData,
                    error: "Mobile number should be 10 digits.",
                });
            }

            if (userData.username !== username || userData.email !== email || userData.mobile !== parseInt(mobile)) {
                if (userData.username !== username) {
                    await User.updateOne({ _id: id }, { $set: { username } })
                }
                if (userData.email !== email) {
                    await User.updateOne({ _id: id }, { $set: { email } })
                }
                if (userData.mobile !== parseInt(mobile)) {
                    await User.updateOne({ _id: id }, { $set: { mobile } })
                }

                res.redirect("/profile")

            } else {
                res.render("users/edit-profile", { user: req.session.user_id, userProfile: userData, error: "You have to make some changes" })
            }
        }

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const loadChangePass = async (req, res) => {

    try {

        const userProfile = await User.findById(req.session.user_id)

        res.render("users/change-passUser", { user: req.session.user_id, userProfile })

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const ChangePass = async (req, res) => {

    try {

        const { id, oldPassword, newPassword } = req.body

        const userProfile = await User.findById(id)

        const passwordMatch = await bcrypt.compare(oldPassword, userProfile.password)

        if (passwordMatch) {

            const sNewPassword = await securePassword(newPassword)
            await User.updateOne({ _id: id }, { $set: { password: sNewPassword } })

            return res.redirect("/profile")

        } else {
            return res.render("users/change-passUser", { user: req.session.user_id, userProfile, error: "Your old password is incorrect" })
        }


    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const loadAddAddress = async (req, res) => {

    try {

        res.render("users/addAdress", { user: req.session.user_id })

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const AddAddress = async (req, res) => {

    try {
        const { name, mobile, country, state, district, city, pincode, address } = req.body

        // Validate mobile (10 digits)
        if (!/^\d{10}$/.test(mobile)) {
            return res.render("users/addAdress", { user: req.session.user_id, error: "Mobile number should be 10 digits." })
        }

        const check = await Address.find({ userId: req.session.user_id })

        if (check.length > 0) {
            const addAddress = new Address({
                userId: req.session.user_id, name, mobile, country, state, district, city, pincode, address
            });
            addAddress.save()
        } else {
            const addAddress = new Address({
                userId: req.session.user_id, name, mobile, country, state, district, city, pincode, address, default: true
            });
            addAddress.save()
        }

        res.redirect("/profile")

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const deleteAddress = async (req, res) => {

    try {

        const checkTorF = await Address.findById({ _id: req.query.id });

        const check = await Address.findOne({ userId: req.session.user_id, default: false })

        if (check) {
            if (checkTorF.default === true) {

                await Address.updateOne({ _id: check._id }, { default: true })

            }
        }

        await Address.findByIdAndDelete({ _id: req.query.id });

        res.redirect("/profile")

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const loadEditAddress = async (req, res) => {

    try {

        const id = req.query.id;

        const editAddress = await Address.findById(id)

        if (editAddress) {
            res.render("users/edit-Address", { user: req.session.user_id, editAddress })
        } else {
            res.redirect("/profile")
        }

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const EditAddress = async (req, res) => {

    try {

        const { name, mobile, country, state, district, city, pincode, address } = req.body

        // Validate mobile (10 digits)
        if (!/^\d{10}$/.test(mobile)) {
            const id = req.body.id;

            const editAddress = await Address.findById(id)
            return res.render("users/edit-Address", { user: req.session.user_id, error: "Mobile number should be 10 digits.", editAddress })
        }

        await Address.updateOne({ _id: req.body.id }, { $set: { name, mobile, country, state, district, city, pincode, address } })
        res.redirect("/profile")

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

module.exports = {
    loadProfile,
    updateProfilePhoto,
    deleteProfilePhoto,
    loadEditProfile,
    EditProfile,
    loadChangePass,
    ChangePass,
    loadAddAddress,
    AddAddress,
    deleteAddress,
    loadEditAddress,
    EditAddress,
}
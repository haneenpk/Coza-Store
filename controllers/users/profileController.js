const User = require("../../models/usersModel")
const Address = require("../../models/addressModel")
const UserOTPVerification = require("../../models/userOTPVerification")
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")

const loadProfile = async (req, res) => {

    try {

        const userProfile = await User.findById(req.session.user_id)
        const userAddress = await Address.find({ userId: req.session.user_id })

        res.render("users/profile", { activePage: "profile", user: req.session.user_id, userProfile, userAddress })

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const loadEditProfile = async (req, res) => {

    try {

        const userProfile = await User.findById(req.query.id)

        res.render("users/edit-profile", { activePage: "profile", user: req.session.user_id, userProfile })

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
            const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
            if (!emailRegex.test(email)) {
                return res.render("users/edit-profile", {
                    activePage: "profile",
                    user: req.session.user_id,
                    userProfile: userData,
                    error: "Enter a valid Gmail address.",
                });
            }

            // Validate mobile (10 digits)
            if (!/^\d{10}$/.test(mobile)) {
                return res.render("users/edit-profile", {
                    activePage: "profile",
                    user: req.session.user_id,
                    userProfile: userData,
                    error: "Mobile number should be 10 digits.",
                });
            }

            // Validate username (no white spaces, no symbols, no numbers)
            if (/^\S*$/.test(username) && /^[a-zA-Z]+$/.test(username)) {
                if (userData.username !== username || userData.email !== email || userData.mobile !== parseInt(mobile)) {
                    if (userData.username !== username) {
                        const existingUser = await User.findOne({ username: username })

                        if (existingUser) {
                            return res.render("users/edit-profile", {
                                activePage: "profile",
                                user: req.session.user_id,
                                userProfile: userData,
                                error: "User name already exists",
                            });
                        }

                        await User.updateOne({ _id: id }, { $set: { username } })
                    }

                    if (userData.mobile !== parseInt(mobile)) {
                        await User.updateOne({ _id: id }, { $set: { mobile } })
                    }

                    if (userData.email !== email) {

                        const existingEmail = await User.findOne({ email: email })

                        if (existingEmail) {
                            return res.render("users/edit-profile", {
                                activePage: "profile",
                                user: req.session.user_id,
                                userProfile: userData,
                                error: "Email already exists",
                            });
                        }

                        const otp = `${Math.floor(1000 + Math.random() * 9000)}`

                        // mail options
                        const mailOptions = {
                            from: process.env.AUTH_EMAIL,
                            to: email,
                            subject: "Verify Your Email",
                            html: `<p>Enter <b>${otp}</b> in the website changing for email verifying process</p>
                            <p>This code <b>expire in 1 minutes</b>.</p>`,
                        }

                        // hash the otp
                        const saltRounds = 10

                        const hashedOTP = await bcrypt.hash(otp, saltRounds)
                        const newOTPVerification = await new UserOTPVerification({
                            userId: userData._id,
                            otp: hashedOTP,
                            createdAt: Date.now(),
                            expiresAt: Date.now() + 60000,
                        })

                        // save otp record
                        await newOTPVerification.save()
                        await transporter.sendMail(mailOptions)

                        res.redirect(`/verifyChangeMail?userId=${userData._id}&changeMail=${email}`)

                    }

                    res.redirect("/profile")

                } else {
                    res.render("users/edit-profile", { activePage: "profile", user: req.session.user_id, userProfile: userData, error: "You have to make some changes" })
                }

            } else {
                return res.render("users/edit-profile", {
                    activePage: "profile",
                    user: req.session.user_id,
                    userProfile: userData,
                    error: "Username should only contain alphabetical characters and no spaces.",
                });
            }

        }

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const loadOTPChangeMail = async (req, res) => {

    try {

        if (req.query.userId && req.query.changeMail) {
            res.render("users/changeMail-otp", { userId: req.query.userId, changeMail: req.query.changeMail })
        } else {
            return res.redirect("/profile")
        }

    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const verifyOTPChangeMail = async (req, res) => {
    try {

        let { otp, userId, changeMail } = req.body
        if (!userId || !otp || !changeMail) {
            res.render("users/changeMail-otp", { message: `Empty otp details are not allowed`, userId, changeMail })
        } else {
            const UserOTPVerificationRecords = await UserOTPVerification.find({
                userId,
            })
            if (UserOTPVerificationRecords.length <= 0) {
                //no record found
                res.render("users/changeMail-otp", { message: "Account record doesn't exist . Please sign up", userId, changeMail })
            } else {
                //user otp records exists
                const { expiresAt } = UserOTPVerificationRecords[UserOTPVerificationRecords.length - 1]
                const hashedOTP = UserOTPVerificationRecords[UserOTPVerificationRecords.length - 1].otp

                if (expiresAt < Date.now()) {
                    //user otp records has expires
                    await UserOTPVerification.deleteMany({ userId })
                    res.render("users/changeMail-otp", { message: "Code has expires. Please request again.", userId, changeMail })
                } else {
                    const validOTP = await bcrypt.compare(otp, hashedOTP)

                    if (!validOTP) {
                        //supplied otp is wrong
                        res.render("users/changeMail-otp", { message: "Invalid OTP. Check your Email.", userId, changeMail })
                    } else {
                        //success
                        await User.updateOne({ _id: userId }, { $set: { email: changeMail } })
                        await UserOTPVerification.deleteMany({ userId })
                        res.redirect("/profile")
                    }
                }
            }
        }
    } catch (error) {
        res.render("error/internalError", { error })
    }
}

// Nodemailer stuff
let transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
    },
})

const loadChangePass = async (req, res) => {

    try {

        const userProfile = await User.findById(req.session.user_id)

        res.render("users/change-passUser", { activePage: "profile", user: req.session.user_id, userProfile })

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
            return res.render("users/change-passUser", { activePage: "profile", user: req.session.user_id, userProfile, error: "Your old password is incorrect" })
        }


    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const loadAddAddress = async (req, res) => {

    try {

        const userAddress = await Address.find({ userId: req.session.user_id })

        if (userAddress.length < 4) {
            res.render("users/addAdress", { activePage: "profile", user: req.session.user_id })
        } else {
            res.redirect("/profile")
        }


    } catch (error) {
        res.render("error/internalError", { error })
    }

}

const AddAddress = async (req, res) => {

    try {
        const { name, mobile, country, state, district, city, pincode, address } = req.body

        // Validate mobile (10 digits)
        if (!/^\d{10}$/.test(mobile)) {
            return res.render("users/addAdress", { activePage: "profile", user: req.session.user_id, error: "Mobile number should be 10 digits." })
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
            res.render("users/edit-Address", { activePage: "profile", user: req.session.user_id, editAddress })
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
            return res.render("users/edit-Address", { activePage: "profile", user: req.session.user_id, error: "Mobile number should be 10 digits.", editAddress })
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
    loadOTPChangeMail,
    verifyOTPChangeMail,
    loadChangePass,
    ChangePass,
    loadAddAddress,
    AddAddress,
    deleteAddress,
    loadEditAddress,
    EditAddress,
}
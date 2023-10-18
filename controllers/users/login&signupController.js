const mongoose = require('mongoose');
const User = require("../../models/usersModel")
const UserOTPVerification = require("../../models/userOTPVerification")

const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")

const securePassword = async (password) => {

    try {

        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash;

    } catch (error) {
        console.log(error.message);
    }

}

const insertUsers = async (req, res) => {

    try {

        console.log(req.body);
        const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

        if (!req.body.username) return res.render("users/signup", { error: "username should be filled" })

        const existingUser = await User.findOne({ username: req.body.username })

        if (existingUser) return res.render("users/signup", { error: "username already exists" })

        if (!req.body.email) {
            return res.render("users/signup", { error: "email should be filled" })
        } else if (!emailRegex.test(req.body.email)) {
            return res.render("users/signup", { error: "email should be valid" })
        }

        const existingEmail = await User.findOne({ email: req.body.email })

        if (existingEmail) return res.render("users/signup", { error: "email already exists" })

        if (!req.body.mobile) return res.render("users/signup", { error: "mobile no should be filled" })

        if (!req.body.password) return res.render("users/signup", { error: "password should be filled" })

        const spassword = await securePassword(req.body.password)
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            mobile: req.body.mobile,
            password: spassword,
            verified: false
        });

        user
            .save()
            .then((result) => {
                // sendVerificationEmail(result, res)
                sendOTPVerificationEmail(result, res)
            })
            .catch((err) => {
                console.log(err);
                res.render("users/signup", { message: "An error occur while saving process" })
            })

        if (user) {
            res.redirect(`/verifyOTP?userId=${user._id}`)
        } else {
            res.render("users/signup", { error: "Your signup has been failed" })
        }

    } catch (error) {
        res.send('helloworld')
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

const sendOTPVerificationEmail = async ({ _id, email }, res) => {
    try {

        const otp = `${Math.floor(1000 + Math.random() * 9000)}`

        // mail options
        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: email,
            subject: "Verify Your Email",
            html: `<p>Enter <b>${otp}</b> in the app verify your email address and complete the signup process</p>
            <p>This code <b>expire in 1 minutes</b>.</p>`,
        }

        // hash the otp
        const saltRounds = 10

        const hashedOTP = await bcrypt.hash(otp, saltRounds)
        const newOTPVerification = await new UserOTPVerification({
            userId: _id,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
        })

        // save otp record
        await newOTPVerification.save()
        await transporter.sendMail(mailOptions)

    } catch (error) {
        // res.json({
        //     status: "FAILED",
        //     message: error.message,
        // })
    }
}

//load OTP page
const loadOTPpage = async (req, res) => {
    try {
        const userId = req.query.userId

        res.render("users/signup-otp", { userId })

    } catch (error) {
        console.log(error.message);
    }

}


// verify otp mail
const verifyOTPSignup = async (req, res) => {
    try {
        let { otp, userId } = req.body
        if (!userId || !otp) {
            res.render("users/signup-otp", { message: `Empty otp details are not allowed`, userId })
        } else {
            const UserOTPVerificationRecords = await UserOTPVerification.find({
                userId,
            })
            if (UserOTPVerificationRecords.length <= 0) {
                //no record found
                res.render("users/signup-otp", { message: "Account record doesn't exist or has been verified already. Please sign up or log in.", userId })
            } else {
                //user otp records exists
                const { expiresAt } = UserOTPVerificationRecords[0]
                const hashedOTP = UserOTPVerificationRecords[0].otp

                if (expiresAt < Date.now()) {
                    //user otp records has expires
                    await UserOTPVerification.deleteMany({ userId })
                    res.render("users/signup-otp", { message: "Code has expires. Please request again.", userId })
                } else {
                    const validOTP = await bcrypt.compare(otp, hashedOTP)

                    if (!validOTP) {
                        //supplied otp is wrong
                        res.render("users/signup-otp", { message: "Invalid OTP. Check your Email.", userId })
                    } else {
                        //success
                        await User.updateOne({ _id: userId }, { $set: { verified: true } })
                        await UserOTPVerification.deleteMany({ userId })
                        res.render("users/login")
                    }
                }
            }
        }
    } catch (error) {
        res.json({
            status: "FAILED",
            message: error.message,
        })
    }
}

const loadSignup = async (req, res) => {

    try {

        res.render("users/signup")

    } catch (error) {
        console.log(error.message);
    }

}

const loadLogin = async (req, res) => {

    try {

        res.set('Cache-Control', 'no-store')
        res.render("users/login")

    } catch (error) {
        console.log(error.message);
    }

}

//load forget password
const loadForgetPass = async (req, res) => {
    try {

        res.render("users/forget-pass")

    } catch (error) {
        console.log(error.message);
    }

}

const loadOTPForgetPass = async (req, res) => {
    try {

        if (!req.body.username) return res.render("users/forget-pass", { message: "username should be filled" })
        if (!req.body.email) return res.render("users/forget-pass", { message: "email should be filled" })
        const userData = await User.findOne({ username: req.body.username })

        if (userData) {

            if (userData.email === req.body.email) {

                const otp = `${Math.floor(1000 + Math.random() * 9000)}`

                // mail options
                const mailOptions = {
                    from: process.env.AUTH_EMAIL,
                    to: userData.email,
                    subject: "Verify Your Email",
                    html: `<p>Enter <b>${otp}</b> in the website verify your email address to forget password process</p>
                    <p>This code <b>expire in 1 minutes</b>.</p>`,
                }

                // hash the otp
                const saltRounds = 10

                const hashedOTP = await bcrypt.hash(otp, saltRounds)
                const newOTPVerification = await new UserOTPVerification({
                    userId: userData._id,
                    otp: hashedOTP,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + 3600000,
                })

                // save otp record
                await newOTPVerification.save()
                await transporter.sendMail(mailOptions)


                res.redirect(`/verifyOTPForgetPass?userId=${userData._id}`)

            } else {
                res.render("users/forget-pass", { message: "email is incorrect" })
            }

        } else {
            res.render("users/forget-pass", { message: "username is incorrect" })
        }

    } catch (error) {
        console.log(error.message);
    }

}

const loadOTPForgetPassPage = async (req, res) => {

    try {

        res.render("users/forgetPass-otp", { userId: req.query.userId })

    } catch (error) {
        console.log(error.message);
    }

}

const verifyOTPForgetPassPage = async (req, res) => {
    try {

        let { otp, userId } = req.body
        if (!userId || !otp) {
            res.render("users/forgetPass-otp", { message: `Empty otp details are not allowed`, userId })
        } else {
            const UserOTPVerificationRecords = await UserOTPVerification.find({
                userId,
            })
            if (UserOTPVerificationRecords.length <= 0) {
                //no record found
                res.render("users/forgetPass-otp", { message: "Account record doesn't exist . Please sign up", userId })
            } else {
                //user otp records exists
                const { expiresAt } = UserOTPVerificationRecords[0]
                const hashedOTP = UserOTPVerificationRecords[0].otp

                if (expiresAt < Date.now()) {
                    //user otp records has expires
                    await UserOTPVerification.deleteMany({ userId })
                    res.render("users/forgetPass-otp", { message: "Code has expires. Please request again.", userId })
                } else {
                    const validOTP = await bcrypt.compare(otp, hashedOTP)

                    if (!validOTP) {
                        //supplied otp is wrong
                        res.render("users/forgetPass-otp", { message: "Invalid OTP. Check your Email.", userId })
                    } else {
                        //success
                        await UserOTPVerification.deleteMany({ userId })
                        res.render("users/changePass", { userId })
                    }
                }
            }
        }
    } catch (error) {
        res.json({
            status: "FAILED",
            message: error.message,
        })
    }
}

const changePass = async (req, res) => {
    try {

        let { userId, password } = req.body
        if (!userId || !password) {
            res.render("users/changePass", { message: `Empty password is not allowed`, userId })
        } else {
            const UserOTPVerificationRecords = await User.find({
                _id: userId
            })
            if (UserOTPVerificationRecords.length <= 0) {
                //no record found
                res.render("users/changePass", { message: `Account record doesn't exist . Please sign up`, userId })
            } else {

                //success
                const spassword = await securePassword(password)
                await User.updateOne({ _id: userId }, { $set: { password: spassword } })
                await UserOTPVerification.deleteMany({ userId })

                res.render("users/login", { success: "Password is changed" })

            }
        }
    } catch (error) {
        res.json({
            status: "FAILED",
            message: error.message,
        })
    }
}

const verifyLogin = async (req, res) => {

    try {

        if (!req.body.username) return res.render("users/login", { message: "username should be filled" })
        if (!req.body.password) return res.render("users/login", { message: "password should be filled" })

        const username = req.body.username
        const password = req.body.password

        const userData = await User.findOne({ username: username })

        if (userData) {

            const passwordMatch = await bcrypt.compare(password, userData.password)

            if (passwordMatch) {
                if (userData.verified === true) {
                    if (userData.blocked === false) {
                        req.session.user_id = userData._id
                        res.redirect("/home")
                    } else {
                        res.render("users/login", { message: "Your account is Blocked" })
                    }
                } else {
                    res.render("users/login", { message: "Your account is not verified" })
                }
            } else {
                res.render("users/login", { message: "password is incorrect" })
            }

        } else {
            res.render("users/login", { message: "Username and password is incorrect" })
        }

    } catch (error) {
        console.log(error.message);
    }

}

const userLogout = async (req, res) => {

    try {

        req.session.destroy()
        res.redirect("/home")

    } catch (error) {
        console.log(error.message);
    }

}

module.exports = {
    insertUsers,
    loadSignup,
    loadOTPpage,
    verifyOTPSignup,
    loadLogin,
    loadForgetPass,
    loadOTPForgetPass,
    loadOTPForgetPassPage,
    verifyOTPForgetPassPage,
    changePass,
    verifyLogin,
    userLogout,
}
require('dotenv').config();

const mongoose = require("mongoose")
const noCache = require('nocache');
const methodOveride = require('method-override')

mongoose.connect("mongodb://127.0.0.1:27017/project1");

const express = require("express")
const app = express()
app.use(noCache());

app.use(methodOveride("_method"))

app.use(express.static("public"))

//for admin routes
const adminRoute = require("./routes/adminRoute")
app.use("/admin",adminRoute)

//for user routes
const usersRoute = require("./routes/usersRoute");
app.use("/",usersRoute)

const PORT = process.env.PORT

app.listen(PORT,() => console.log(`Server Running on port ${PORT}...`));
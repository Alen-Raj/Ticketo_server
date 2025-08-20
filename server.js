require('dotenv').config();
const express = require('express')
const cors = require("cors")
const passport = require("passport");
require("./config/passport");
const DB = require("./config/db")
const path=require('path')
const userRouter=require("./routes/userRouter")
const adminRouter=require("./routes/adminRouter")
const theatreRouter=require("./routes/theatreRouter")

const app = express()

DB()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize())

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use("/user",userRouter)
app.use("/admin",adminRouter)
app.use("/theater",theatreRouter)


const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`);

})
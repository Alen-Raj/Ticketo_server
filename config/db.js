const mongoose = require("mongoose")


const DB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("DB Connected");

    } catch (error) {

        console.log("Database Connected:", error);
        process.exit(1)

    }
}

module.exports = DB
const mongoose = require("mongoose");
require("dotenv").config(); // ✅ Ensure environment variables are loaded

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("❌ MONGO_URI is missing from environment variables!");
        }

       const conn = await mongoose.connect(process.env.MONGO_URI);


        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1); // Exit if connection fails
    }
};

module.exports = connectDB;

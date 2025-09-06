/*  This file was created to update old file database
   by adding "size" attribute and initialize to 10 MB */


const mongoose = require("mongoose");
const dotenv = require("env");
const File = require("./models/File"); // Adjust path if needed

// Load environment variables from .env file
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));


// ✅ Update all existing files by setting `size` to 10MB
async function updateFileSize() {
    try {
        const result = await File.updateMany(
            { size: { $exists: false } }, // Only update if `size` is missing
            { $set: { size: 10485760 } }  // 10MB in bytes
        );
        console.log(`Updated ${result.modifiedCount} documents.`);
    } catch (error) {
        console.error("Error updating file sizes:", error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the update function
updateFileSize();

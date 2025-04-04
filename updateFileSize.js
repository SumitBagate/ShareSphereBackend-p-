/*  This file was created to update old file database
   by adding "size" attribute and initialize to 10 MB */


const mongoose = require("mongoose");
const File = require("./models/File"); // Adjust path if needed

// ✅ Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/sharesphere", { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err));

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

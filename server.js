const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");

const fileRoutes = require("./routes/files");
const userRoutes = require("./routes/user");
const authRoutes = require("./middleware/auth");
const connectDB = require("./config/db");

dotenv.config();
const app = express();

// ✅ Connect to MongoDB before starting server
connectDB();

// ✅ Middleware

app.use(cors());
app.use(express.json()); // Parses JSON requests
app.use(express.urlencoded({ extended: true })); // Parses form-data fields
 
// ✅ GridFSBucket Setup (Native MongoDB Storage)
let bucket;
mongoose.connection.once("open", () => {
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
    console.log("✅ GridFSBucket Initialized!");
});



// ✅ Routes
app.get("/", (req, res) => {
    res.send("🎉 Welcome to the ShareSphere Backend API!");
});
app.use("/api/files", fileRoutes);
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ✅ Log MongoDB Connection & Collections
mongoose.connection.on("open", () => {
    console.log("✅ MongoDB connection open!");
    mongoose.connection.db.listCollections().toArray((err, collections) => {
        if (err) console.error("❌ Error listing collections:", err);
        else console.log("📂 Collections:", collections.map((c) => c.name));
    });
});

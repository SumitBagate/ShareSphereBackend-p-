const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const User = require("../models/User");

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Sign in & Create User

router.post("/signin", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; 
    if (!token) return res.status(401).json({ error: "Token required" });

    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email } = decodedToken;

    // Check if user exists in MongoDB
    let user = await User.findOne({ firebaseUID: uid });

    if (!user) {
      // Create new user with default credits = 10
      user = new User({
        email,
        firebaseUID: uid,
        uploadedFiles: [],
        downloadedFiles: [],
        credits: 10,
      });

      await user.save();
    }

    res.json({ message: "User authenticated", user });
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;


const User = require("../models/User");

const attachDbUser = async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "No UID found in token" });

    let user = await User.findOne({ firebaseUID: uid });

    if (!user) {
      // Auto-create user from Firebase token
      user = await User.create({
        firebaseUID: uid,
        email: req.user.email,
        name: req.user.name,
        profilePic: req.user.picture,
        credits: 10,
        uploadedFiles: [],
        downloadedFiles: []
      });
      console.log("🆕 User created in DB:", user.email);
    } else {
      console.log("✅ User found in DB:", user.email);
    }

    req.dbUser = user;
    next();
  } catch (error) {
    console.error("❌ attachDbUser error:", error.message);
    res.status(500).json({ error: "Failed to attach user" });
  }
};

module.exports = attachDbUser;

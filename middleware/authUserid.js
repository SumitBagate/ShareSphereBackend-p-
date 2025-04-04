const admin = require("firebase-admin");

// Middleware to authenticate Firebase user and extract UID
async function authenticateUser(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log("🟢 Decoded Token:", decodedToken); // ✅ Debug token
        req.user = { uid: decodedToken.uid };
        console.log("🟢 User UID:", req.user.uid); // ✅ Debug extracted UID
        next();
    } catch (error) {
        return res.status(403).json({ error: "Unauthorized: Invalid token", details: error.message });
    }
}

module.exports = authenticateUser;

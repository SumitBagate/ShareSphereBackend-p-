const User = require("../models/User");
const admin = require("../firebaseAdmin"); // Ensure Firebase Admin SDK is imported

const ensureUserExists = async (req, res, next) => {
    try {
        const firebaseUID = req.user.uid;

        // Check if user exists in MongoDB
        let user = await User.findOne({ firebaseUID });

        if (!user) {
            console.log(`🔹 User ${firebaseUID} not found in DB. Fetching details from Firebase...`);

            // Fetch user info from Firebase
            const userRecord = await admin.auth().getUser(firebaseUID);
            const userEmail = userRecord.email || ""; // Default to empty string if email is missing

            if (!userEmail) {
                return res.status(400).json({ error: "Email is required but not found in Firebase." });
            }

            // Create new user entry
            user = new User({
                email: userEmail,
                firebaseUID,
                credits: 10, // Starting credits for new users
                uploadedFiles: [],
                downloadedFiles: []
            });

            await user.save();
            console.log(`✅ New user ${firebaseUID} added to DB.`);
        }

        // Attach user to request object for further use
        req.dbUser = user;
        next();
    } catch (error) {
        console.error("❌ Error ensuring user exists:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = ensureUserExists;

const File = require("../models/File");
const User = require("../models/User");

// Controller to like or unlike a file
const likeFile = async (req, res) => {
    try {
        console.log("🟢 Like Route Hit!");

        const userId = req.user.uid;
        const fileID = req.params.fileID;

        console.log("🔹 Checking File ID:", fileID);

        // Check if file exists
        const file = await File.findOne({ fileID: fileID });

        if (!file) {
            console.log("❌ File not found!");
            return res.status(404).json({ error: "File not found" });
        }

        // Check if user exists in the database
        const user = await User.findOne({ firebaseUID: userId });

        if (!user) {
            console.log("❌ User not found!");
            return res.status(404).json({ error: "User not found" });
        }

        // Check if the user already liked the file
        const hasLiked = file.likes.includes(user._id);

        if (hasLiked) {
            // If already liked, remove the like (unlike)
            file.likes = file.likes.filter((id) => !id.equals(user._id));
            console.log("🔻 Like removed.");
        } else {
            // If not liked, add the like
            file.likes.push(user._id);
            console.log("🔺 Like added.");
        }

        await file.save();
        res.status(200).json({
            message: hasLiked ? "Like removed" : "File liked",
            likesCount: file.likes.length
        });

    } catch (error) {
        console.error("❌ Error in Liking File:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { likeFile };

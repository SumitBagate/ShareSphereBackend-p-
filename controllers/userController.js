const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const multer = require("multer");
const File = require("../models/File");
const User = require("../models/User");
const Transaction = require("../models/Transcation");

const storage = multer.memoryStorage();
const upload = multer({ storage });

let bucket;
mongoose.connection.once("open", () => {
    bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
    console.log("GridFSBucket Connected!");
});
const getCredits = async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ credits: user.credits });
    } catch (err) {
        console.error("❌ Error fetching credits:", err);
        res.status(500).json({ error: "Failed to fetch user credits" });
    }
};
const getMyUploads = async (req, res) => {
    try {
      console.log("🟢 Firebase UID from token:", req.user.uid);
      
      const user = await User.findOne({ firebaseUID: req.user.uid });
  
      if (!user) {
        console.error("❌ User not found");
        return res.status(404).json({ error: "User not found" });
      }
  
      console.log("🟢 Found user:", user.email || user._id);
      console.log("🟢 Uploaded file IDs:", user.uploadedFiles);
  
      const fileIds = user.uploadedFiles.map((id) =>
        new mongoose.Types.ObjectId(id)
      );
      console.log("🟢 Searching files with IDs:", fileIds);
  
      const files = await File.find({ _id: { $in: fileIds } });
  
      console.log("🟢 Found files:", files.length);
      res.status(200).json({ count: files.length, files });
    } catch (err) {
      console.error("❌ Error fetching uploaded files:", err);
      res.status(500).json({ error: "Failed to fetch uploaded files" });
    }
  };
  
// const getMyUploads = async (req, res) => {
//     try {
//         // Find user by Firebase UID (coming from authenticateUser)
//         const user = await User.findOne({ firebaseUID: req.user.uid });

//         if (!user) {
//             return res.status(404).json({ error: "User not found" });
//         }

//         // Debug: Show uploadedFiles array
//         console.log("Uploaded file IDs:", user.uploadedFiles);

//         // Make sure all IDs are ObjectIds
//         const fileIds = user.uploadedFiles.map(id =>
//             new mongoose.Types.ObjectId(id)
//         );

//         // Fetch files whose _id is in uploadedFiles array
//         const files = await File.find({ _id: { $in: fileIds } });

//         res.status(200).json({
//             count: files.length,
//             files: files,
//         });
//     } catch (err) {
//         console.error("❌ Error fetching uploaded files:", err);
//         res.status(500).json({ error: "Failed to fetch uploaded files" });
//     }
// };

module.exports = { getCredits, getMyUploads };

const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  fileID: { type: String, required: true, unique: true },
  title: { type: String, required: false },
  fileName: { type: String, required: true },
  uploadedBy: { type: String, required: true }, // 🔥 Store UID as a String instead of ObjectId
  downloads: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  issues: [
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        issueType: String,  // E.g., "Incorrect Content", "Poor Quality"
        description: String,
        reportedAt: { type: Date, default: Date.now }
    }
],
  size: { type: Number, required: true },
  fileType: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  description: { type: String, required: true }
});

module.exports = mongoose.model("File", FileSchema);

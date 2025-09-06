const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firebaseUID: { type: String, required: true, unique: true },
  uploadedFiles: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
  downloadedFiles: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
  credits: { type: Number, default: 0 },
  name: { type: String }, // ✅ define type only
  profilePic: { type: String }, 
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }] // ✅ Store transactions
});

module.exports = mongoose.model("User", userSchema);

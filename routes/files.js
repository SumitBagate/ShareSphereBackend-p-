const express = require("express");
const multer = require("multer");
const authenticateUser = require("../Middleware/authenticateUser");
const ensureUserExists = require("../middleware/ensureUserExist");
const {
    uploadFile,
    getAllFiles,
    getFile,
    downloadFile
} = require("../controllers/fileController");
const { likeFile } = require("../controllers/likeController");
const { reportIssue, getFileIssues } = require("../controllers/reportController");
const { getTransactionHistory } = require("../controllers/transactionController");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// File Upload
router.post("/upload", authenticateUser, ensureUserExists, upload.single("file"), uploadFile);

// Get All Files with Filters
router.get("/all", authenticateUser, getAllFiles);

// Get a File from GridFS
router.get("/uploads/:filename", getFile);

// Download File
router.get("/download/:fileID", authenticateUser, downloadFile);

// Get Transaction History
router.get("/history", authenticateUser, getTransactionHistory);

// Like a Post
router.post("/like/:fileID", authenticateUser, likeFile);

// Report an Issue
router.post("/report/:fileID", authenticateUser, reportIssue);

// Fetch all Issues of a File
router.get("/issues/:fileID", authenticateUser, getFileIssues);

module.exports = router;

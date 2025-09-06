const mongoose = require("mongoose");
const File = require("../models/File");
const User = require("../models/User");

// Controller to report an issue for a downloaded file
const reportIssue = async (req, res) => {
    try {
        console.log("🟢 [Report] Route Hit at", new Date().toISOString());
        const userId = req.user.uid;
        const fileID = req.params.fileID;
        console.log("🔹 Checking File ID:", fileID); 

        if (!mongoose.Types.ObjectId.isValid(fileID)) {
            return res.status(400).json({ error: "Invalid file ID format" });
        }

        const fileObjectId = new mongoose.Types.ObjectId(fileID);

        // Fetch user from database
        const user = await User.findOne({ firebaseUID: userId });
        if (!user) {
            return res.status(404).json({ error: "User not found in database" });
        }
        const hasDownloaded = user.downloadedFiles.some(downloadedFile =>
            downloadedFile.equals(fileObjectId)
        );

        if (!hasDownloaded) {
            return res.status(403).json({ error: "You can only report files you have downloaded." });
        }
        // Fetch file from database
        const file = await File.findOne({ _id: fileObjectId });
        if (!file) {
            return res.status(404).json({ error: "File not found in database" });
        }

        console.log("✅ File found:", file);

        // Check if the user has downloaded the file
    

        // Extract issue details from request body
        const { issueType, description } = req.body;

        // Add issue to the file document
        file.issues.push({
            userId: user._id,
            issueType,
            description,
            reportedAt: new Date()
        });

        await file.save();

        res.status(200).json({
            message: "Issue reported successfully.",
            issues_count: file.issues.length
        });

    } catch (error) {
        console.error("❌ Error Reporting Issue:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Controller to fetch all issues of a specific file
const getFileIssues = async (req, res) => {
    try {
        const fileID = req.params.fileID;
        console.log("🟢 Fetching issues for file:", fileID);

        // Find file using fileID field
        const file = await File.findOne({ fileID: fileID });

        if (!file) {
            console.log("❌ File not found!");
            return res.status(404).json({ error: "File not found" });
        }

        // Fetch user details for each issue
        const issuesWithEmails = await Promise.all(
            file.issues.map(async (issue) => {
                const user = await User.findById(issue.userId);
                return {
                    userId: issue.userId,
                    email: user ? user.email : "Unknown",
                    issueType: issue.issueType,
                    description: issue.description,
                    reportedAt: issue.reportedAt
                };
            })
        );
        
        // Return the issues array
        res.status(200).json({ issues: issuesWithEmails });

    } catch (error) {
        console.error("❌ Error fetching issues:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { reportIssue, getFileIssues };
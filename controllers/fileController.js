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

const CREDIT_REWARD = 10;
const DOWNLOAD_COST = 5;

// Upload File
const uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded." });
        const user = req.dbUser;

        const uploadStream = bucket.openUploadStream(req.file.originalname, {
            contentType: req.file.mimetype,
            metadata: { userId: user._id.toString() },
        });

        uploadStream.end(req.file.buffer);
        uploadStream.on("finish", async () => {
            const newFile = new File({
                fileID: uploadStream.id,
                fileName: req.file.originalname,
                title: req.body.title || req.file.originalname,
                uploadedBy: user.firebaseUID, // ✅ Fixed here
                size: req.file.size,
                fileType: req.file.mimetype,
                description: req.body.description || "",
                uploadDate: new Date(),
            });

            await newFile.save();
            user.uploadedFiles.push(newFile._id); // ✅ Correct reference
            user.credits += CREDIT_REWARD;
            await user.save();
            

            await new Transaction({
                userId: user._id,
                amount: CREDIT_REWARD,
                type: "credit",
                description: `Earned credits for uploading "${req.file.originalname}"`,
                date: new Date(),
            }).save();

            res.status(201).json({
                message: "✅ File uploaded successfully, credits awarded",
                file: { id: uploadStream.id, filename: req.file.originalname },
                credits: user.credits,
            });
        });
    } catch (error) {
        console.error("❌ Upload Error:", error);
        res.status(500).json({ error: "File upload failed" });
    }
};



//------------delete file------------------






const deleteFile = async (req, res) => {
    try {
        const fileID = req.params.fileID;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(fileID)) {
            return res.status(400).json({ error: "Invalid file ID." });
        }

        const fileObjectId = new mongoose.Types.ObjectId(fileID);

        // Get file metadata from File collection
        const file = await File.findById(fileObjectId);
        if (!file) {
            return res.status(404).json({ error: "File not found." });
        }

        // Authorization check
        if (file.uploadedBy.toString() !== req.user.uid) {
            return res.status(403).json({ error: "Unauthorized: Only the uploader can delete this file." });
        }

        // Delete actual file from GridFS
        const gridFsFileID = file.fileID || file._id; // fallback to _id if needed
        await bucket.delete(new mongoose.Types.ObjectId(gridFsFileID));

        // Delete File document
        await File.findByIdAndDelete(fileObjectId);

        // Remove reference from users' downloadedFiles
        await User.updateMany(
            { downloadedFiles: fileObjectId },
            { $pull: { downloadedFiles: fileObjectId } }
        );

        res.status(200).json({ message: "File deleted successfully." });

    } catch (error) {
        console.error("❌ Delete Error:", error);
        res.status(500).json({ error: "Server error while deleting file." });
    }
};


// Get All Files with Filters
const getAllFiles = async (req, res) => {
    try {
        let { fileType, minSize, maxSize, sortBy } = req.query;
        let filter = {};

        if (fileType) filter.fileType = fileType;
        if (minSize || maxSize) {
            filter.size = {};
            if (minSize) filter.size.$gte = parseInt(minSize);
            if (maxSize) filter.size.$lte = parseInt(maxSize);
        }

        let sortOption = { uploadDate: -1 };
        if (sortBy === "oldest") sortOption.uploadDate = 1;
        else if (sortBy === "most_downloads") sortOption = { downloads: -1 };
        else if (sortBy === "most_likes") sortOption = { likes: -1 };

        const files = await File.find(filter).sort(sortOption);

        const firebaseUIDs = files
            .map(file => file.uploadedBy)
            .filter(Boolean); // ✅ filter out any missing

        const users = await User.find({ firebaseUID: { $in: firebaseUIDs } }).select("firebaseUID email");
        const emailMap = Object.fromEntries(users.map(user => [user.firebaseUID, user.email]));

        res.json(files.map(file => ({
            ...file.toObject(),
            uploadedBy: emailMap[file.uploadedBy] || "Unknown", // ✅ Match with Firebase UID
        })));
    } catch (error) {
        console.error("❌ Error fetching files:", error);
        res.status(500).json({ error: "Error fetching files" });
    }
};





const previewFile = async (req, res) => {
    try {
        const fileID = req.params.fileID;

        if (!mongoose.Types.ObjectId.isValid(fileID)) {
            return res.status(400).json({ error: "Invalid file ID" });
        }

        const _id = new mongoose.Types.ObjectId(fileID);

        // ✅ FIXED: get file metadata from GridFS
        const file = await mongoose.connection.db.collection("uploads.files").findOne({ _id });
        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }

        const supportedTypes = ["image/", "video/", "audio/", "text/", "application/pdf"];
        const isPreviewable = supportedTypes.some(type => file.contentType.startsWith(type));

        if (!isPreviewable) {
            return res.status(415).json({ error: "File type not supported for preview" });
        }

        res.set({
            "Content-Type": file.contentType,
            "Content-Disposition": `inline; filename="${file.filename}"`,
        });

        const readStream = bucket.openDownloadStream(_id);
        readStream.pipe(res);

        readStream.on("error", (err) => {
            console.error("GridFS stream error:", err);
            res.status(500).json({ error: "Error streaming file for preview" });
        });
    } catch (error) {
        console.error("❌ Preview Error:", error);
        res.status(500).json({ error: "Server error during preview" });
    }
};




// fetch a file from GridFS
const getFile = async (req, res) => {
    try {
        const file = await mongoose.connection.db.collection("uploads.files").findOne({ filename: req.params.filename });

        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }

        res.set("Content-Type", file.contentType);
        const readStream = bucket.openDownloadStream(file._id);
        readStream.pipe(res);
    } catch (error) {
        console.error("❌ Fetch Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const downloadFile = async (req, res) => {
    try {
        const fileID = req.params.fileID;

        if (!mongoose.Types.ObjectId.isValid(fileID)) {
            return res.status(400).json({ error: "Invalid file ID." });
        }

        const user = await User.findOne({ firebaseUID: req.user.uid });
        if (!user) return res.status(404).json({ error: "User not found" });
        // check user credits before downloading
        if(user.credits < DOWNLOAD_COST) {  
            return res.status(403).json({ error: "Insufficient credits to download this file." });
        }
        const fileObjectId = new mongoose.Types.ObjectId(fileID);
        const alreadyDownloaded = user.downloadedFiles.some(file => file.equals(fileObjectId));

        let file;
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (!alreadyDownloaded) {
                file = await File.findById(fileObjectId).session(session);
                if (!file) return res.status(404).json({ error: "File not found" });

                if (!file.downloads.some(id => id.equals(user._id))) {
                    file.downloads.push(user._id);
                    await file.save({ session });
                }

                user.credits -= DOWNLOAD_COST;
                user.downloadedFiles.push(fileObjectId);
                await user.save({ session });

                await new Transaction({
                    userId: user._id,
                    amount: -DOWNLOAD_COST,
                    type: "debit",
                    description: `Downloaded file ID: ${fileID}`,
                    date: new Date(),
                }).save({ session });
            } else {
                file = await File.findById(fileObjectId);
                if (!file) return res.status(404).json({ error: "File not found" });
            }

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

        // ✅ Correct GridFS streaming using file.fileID
        const gridFsFileId = file.fileID ? new mongoose.Types.ObjectId(file.fileID) : file._id;
        const downloadStream = bucket.openDownloadStream(gridFsFileId);

        res.set({
            "Content-Disposition": `attachment; filename="${file.fileName || 'downloaded_file'}"`,
            "Content-Type": file.fileType,
        });

        downloadStream.pipe(res);

    } catch (error) {
        console.error("❌ Download Error:", error);
        res.status(500).json({ error: "Error downloading file" });
    }
};


module.exports = { uploadFile, getAllFiles, getFile, downloadFile, deleteFile, previewFile };

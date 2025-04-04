const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

let bucket;

mongoose.connection.once("open", () => {
    bucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: "uploads",
    });
    console.log("✅ GridFSBucket Connected!");
});

module.exports = bucket;

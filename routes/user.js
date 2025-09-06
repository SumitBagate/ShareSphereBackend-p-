const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/authUserid");
const { getCredits, getMyUploads } = require("../controllers/userController");

// get credits route
router.get("/credits", authenticateUser, getCredits);

// get my uploads route
router.get("/myuploads", authenticateUser, getMyUploads);


module.exports = router;

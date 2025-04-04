const express = require("express");
const router = express.Router();
const authUserid = require("../middleware/authUserid");

// Route to get the user ID of the logged-in user
router.get("/me", authUserid, (req, res) => {
    res.json({ userId: req.user.uid });
});

module.exports = router;

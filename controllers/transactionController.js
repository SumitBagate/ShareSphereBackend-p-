const Transaction = require("../models/Transcation");
const User = require("../models/User");
// Controller to get transaction history of a user
const getTransactionHistory = async (req, res) => {
    try {
        console.log("🟢 Fetching Transaction History...");

        // Find user by Firebase UID
        const user = await User.findOne({ firebaseUID: req.user.uid });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Fetch last 10 transactions, sorted by latest first
        const transactions = await Transaction.find({ userId: user._id })
        .sort({ date: -1 })
        .limit(10);
        user.transactions = transactions._id;
        res.status(200).json({ transactions });
        
    } catch (error) {
        console.error("❌ Error Fetching Transactions:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { getTransactionHistory };

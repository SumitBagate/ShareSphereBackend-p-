const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true }, // +ve for earnings, -ve for spendings
  type: { type: String, enum: ["credit", "debit"], required: true }, // Credit or Debit
  description: { type: String, required: true }, // What this transaction is for
  date: { type: Date, default: Date.now }, // When it happened
});

module.exports = mongoose.model("Transaction", TransactionSchema);

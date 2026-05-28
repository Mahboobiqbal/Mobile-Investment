const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: ['Deposit', 'Withdrawal'],
      required: true,
    },
    transactionId: {
      type: String,
      required: function () {
        return this.type === 'Deposit';
      },
    },
    targetPhone: {
      type: String,
      required: function () {
        return this.type === 'Withdrawal';
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'withdrawn'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);

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
      enum: ['plan', 'deposit', 'withdrawal', 'Deposit', 'Withdrawal'],
      required: true,
    },
    transactionId: {
      type: String,
      required: function () {
        return ['plan', 'deposit', 'Deposit'].includes(this.type);
      },
    },
    targetPhone: {
      type: String,
      required: function () {
        return ['withdrawal', 'Withdrawal'].includes(this.type);
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'withdrawn'],
      default: 'pending',
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      default: null,
    },
    planName: {
      type: String,
      default: '',
    },
    investmentAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);

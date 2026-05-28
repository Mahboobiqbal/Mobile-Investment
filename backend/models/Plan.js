const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InvestmentCategory',
      required: [true, 'Category is required'],
    },
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    dailyReturnRate: {
      type: Number,
      required: [true, 'Daily return rate is required'],
      min: [0, 'Return rate must be positive'],
    },
    minInvestment: {
      type: Number,
      default: 0,
      min: [0, 'Min investment cannot be negative'],
    },
    maxInvestment: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

planSchema.index({ category: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Plan', planSchema);

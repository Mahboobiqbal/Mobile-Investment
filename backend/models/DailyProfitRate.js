const mongoose = require('mongoose');

const dailyProfitRateSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true,
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.005,
  },
}, { timestamps: true });

module.exports = mongoose.model('DailyProfitRate', dailyProfitRateSchema);

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    audience: {
      type: String,
      enum: ['admin'],
      default: 'admin',
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Object, default: {} },
    // Which admin(s) have read it
    readBy: { type: [String], default: [] },
  },
  { timestamps: true }
);

NotificationSchema.index({ audience: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);


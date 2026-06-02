const express = require('express');
const {
  adminNotificationsStream,
  listAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationRead,
} = require('../controllers/notificationsController');

const router = express.Router();

// Mounted under /api/admin by server.js, so adminAuthMiddleware is applied there.
router.get('/notifications/stream', adminNotificationsStream);
router.get('/notifications', listAdminNotifications);
router.get('/notifications/unread-count', getAdminUnreadCount);
router.post('/notifications/mark-read', markAdminNotificationRead);

module.exports = router;


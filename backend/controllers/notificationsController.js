const Notification = require('../models/Notification');

// In this project, admin identity is not user-based; we use a single adminId.
// This matches the existing admin UI that just wants unread count + list.
const ADMIN_ID = 'admin';

function formatNotification(n) {
  return {
    _id: n._id,
    title: n.title,
    message: n.message,
    meta: n.meta || {},
    createdAt: n.createdAt,
    read: (n.readBy || []).includes(ADMIN_ID),
  };
}

// --- SSE (optional, UI falls back to polling) ---
const clients = new Set();

function pushToClients(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    try {
      res.write(data);
    } catch (e) {
      clients.delete(res);
    }
  }
}

async function adminNotificationsStream(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  // some proxies need flush
  res.flushHeaders?.();

  const pingInterval = setInterval(() => {
    try {
      res.write('event: ping\n');
      res.write('data: {}\n\n');
    } catch (e) {}
  }, 25000);

  clients.add(res);

  res.write(`event: init\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  req.on('close', () => {
    clearInterval(pingInterval);
    clients.delete(res);
  });
}

async function listAdminNotifications(req, res) {
  const { limit: limitStr = '20' } = req.query;
  const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 20));

  const notifications = await Notification.find({ audience: 'admin' })
    .sort({ createdAt: -1 })
    .limit(limit);

  res.status(200).json({
    notifications: notifications.map(formatNotification),
  });
}

async function getAdminUnreadCount(req, res) {
  const count = await Notification.countDocuments({
    audience: 'admin',
    readBy: { $ne: ADMIN_ID },
  });

  res.status(200).json({ count });
}

async function markAdminNotificationRead(req, res) {
  const { notificationId } = req.body;

  if (!notificationId) {
    return res.status(400).json({ message: 'notificationId is required' });
  }

  await Notification.updateOne(
    { _id: notificationId, audience: 'admin' },
    { $addToSet: { readBy: ADMIN_ID } }
  );

  res.status(200).json({ message: 'Marked as read' });
}

async function createAdminNotification({ title, message, meta }) {
  const notification = await Notification.create({
    audience: 'admin',
    title,
    message,
    meta: meta || {},
    readBy: [],
  });

  pushToClients({
    type: 'notification',
    notification: {
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      meta: notification.meta || {},
      createdAt: notification.createdAt,
    },
  });

  return notification;
}

module.exports = {
  adminNotificationsStream,
  listAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationRead,
  createAdminNotification,
};


module.exports = function adminAuthMiddleware(req, res, next) {
  const apiKey = req.headers['x-admin-key'];
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ message: 'Forbidden. Valid admin API key required.' });
  }
  next();
};

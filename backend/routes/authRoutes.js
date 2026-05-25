const express = require('express');

const { getUserDashboardStats, getUserProfile, loginUser, registerUser, updatePassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', authMiddleware, getUserProfile);
router.put('/update-password', authMiddleware, updatePassword);
router.get('/dashboard-stats', authMiddleware, getUserDashboardStats);

module.exports = router;

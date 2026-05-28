const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const User = require('../models/User');
const Transaction = require('../models/Transaction');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      currentBalance: user.currentBalance,
      activePlan: user.activePlan,
      isVerified: user.isVerified,
      dp: user.dp,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
    });

    const token = signToken(user);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        currentBalance: user.currentBalance,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        currentBalance: user.currentBalance,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Login failed' });
  }
};

const getUserProfile = async (req, res) => {
  try {
    return res.status(200).json({
      message: 'Profile fetched successfully',
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to fetch profile' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'newPassword must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Password update failed' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: 'If this email is registered, an OTP has been sent' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    user.otpCode = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.`,
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError.message);
    }

    return res.status(200).json({ message: 'If this email is registered, an OTP has been sent' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to process request' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.otpCode || !user.otpExpires) {
      return res.status(400).json({ message: 'No OTP request found for this email' });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.otpCode = resetToken;
    user.otpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    return res.status(200).json({ message: 'OTP verified successfully', resetToken });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'OTP verification failed' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ message: 'Email, resetToken, and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.otpCode || !user.otpExpires) {
      return res.status(400).json({ message: 'No reset request found' });
    }

    if (user.otpCode !== resetToken) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Password reset failed' });
  }
};

const getUserDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $facet: {
          totalDepositsApproved: [
            {
              $match: {
                type: 'Deposit',
                status: { $in: ['approved', 'Approved'] },
                transactionId: { $not: /^ROI-DAILY-/ },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' },
              },
            },
          ],
          totalWithdrawalsApproved: [
            {
              $match: {
                type: 'Withdrawal',
                status: { $in: ['approved', 'Approved'] },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' },
              },
            },
          ],
          totalROIEarnings: [
            {
              $match: {
                type: 'Deposit',
                transactionId: /^ROI-DAILY-/,
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' },
              },
            },
          ],
        },
      },
    ]);

    const summary = stats[0] || {};

    return res.status(200).json({
      message: 'Dashboard stats fetched successfully',
      totalDepositsApproved: summary.totalDepositsApproved?.[0]?.total || 0,
      totalWithdrawalsApproved: summary.totalWithdrawalsApproved?.[0]?.total || 0,
      totalROIEarnings: summary.totalROIEarnings?.[0]?.total || 0,
    });
  } catch (error) {
    console.error('Dashboard stats calculation failed:', error.message);
    return res.status(500).json({ message: error.message || 'Unable to fetch dashboard stats' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updatePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getUserDashboardStats,
};

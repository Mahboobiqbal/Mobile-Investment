const MutualFund = require('../models/MutualFund');
const User = require('../models/User');

const MIN_ACCOUNT_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_AMOUNT = 500;

const requestMutualFundRedemption = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'A valid positive amount is required' });
    }

    if (amount <= MIN_AMOUNT) {
      return res.status(400).json({ message: `Amount must be greater than Rs. ${MIN_AMOUNT}` });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const accountAge = Date.now() - new Date(user.createdAt).getTime();
    if (accountAge < MIN_ACCOUNT_AGE_MS) {
      return res.status(400).json({ message: 'Account must be at least 1 month old to redeem mutual fund shares' });
    }

    if (user.currentBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance to redeem mutual fund shares' });
    }

    const request = await MutualFund.create({
      user: req.user.id,
      amount,
      status: 'pending',
    });

    return res.status(201).json({
      message: 'Mutual fund redemption request submitted. Awaiting admin approval.',
      request,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Mutual fund redemption request failed' });
  }
};

const getUserMutualFundRequests = async (req, res) => {
  try {
    const requests = await MutualFund.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ requests });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch mutual fund requests' });
  }
};

const getAllMutualFundRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const requests = await MutualFund.find(filter)
      .populate('user', 'name email phone currentBalance createdAt')
      .sort({ createdAt: -1 });
    return res.status(200).json({ requests });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch mutual fund requests' });
  }
};

const reviewMutualFundRequest = async (req, res) => {
  try {
    const { requestId, action, adminNote } = req.body;
    if (!requestId || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'requestId and action (approve/reject) are required' });
    }

    const request = await MutualFund.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Mutual fund request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been reviewed' });
    }

    const user = await User.findById(request.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (action === 'approve') {
      if (user.currentBalance < request.amount) {
        return res.status(400).json({ message: 'Insufficient balance to process redemption' });
      }
      user.currentBalance -= request.amount;
      await user.save();
      request.status = 'approved';
    } else {
      request.status = 'rejected';
    }

    if (adminNote) request.adminNote = adminNote;
    await request.save();

    return res.status(200).json({
      message: `Mutual fund request ${action}d successfully`,
      request,
      userBalance: user.currentBalance,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to review mutual fund request' });
  }
};

module.exports = {
  requestMutualFundRedemption,
  getUserMutualFundRequests,
  getAllMutualFundRequests,
  reviewMutualFundRequest,
};

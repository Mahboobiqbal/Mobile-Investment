const Transaction = require('../models/Transaction');
const User = require('../models/User');

const submitDeposit = async (req, res) => {
  try {
    const { amount, transactionId } = req.body;
    if (!amount || !transactionId) {
      return res.status(400).json({ message: 'Amount and transactionId are required' });
    }

    const existingAuth = await Transaction.findOne({ transactionId });
    if (existingAuth) {
      return res.status(400).json({ message: 'Transaction ID has already been submitted' });
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      amount,
      type: 'Deposit',
      transactionId,
      status: 'pending',
    });

    return res.status(201).json({ message: 'Deposit submitted successfully. Waiting for admin approval.', transaction });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Deposit submission failed' });
  }
};

const requestWithdrawal = async (req, res) => {
  try {
    const { amount, targetPhone } = req.body;
    if (!amount || !targetPhone) {
      return res.status(400).json({ message: 'Amount and targetPhone are required' });
    }

    const user = await User.findById(req.user.id);
    if (user.currentBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance to request withdrawal' });
    }

    // Deduct immediately so they can't double-spend while pending
    user.currentBalance -= amount;
    await user.save();

    const transaction = await Transaction.create({
      user: req.user.id,
      amount,
      type: 'Withdrawal',
      targetPhone,
      status: 'pending',
    });

    return res.status(201).json({ message: 'Withdrawal requested successfully', transaction, currentBalance: user.currentBalance });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Withdrawal request failed' });
  }
};

const selectPlan = async (req, res) => {
  try {
    const { planName } = req.body;
    if (!planName || !['Plan A', 'Plan B', 'Plan C', 'None'].includes(planName)) {
      return res.status(400).json({ message: 'Valid planName is required' });
    }

    const user = await User.findById(req.user.id);
    user.activePlan = planName;
    await user.save();

    return res.status(200).json({ message: `Successfully subscribed to ${planName}`, activePlan: user.activePlan });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Plan selection failed' });
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ transactions });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch transactions' });
  }
};

const distributeDailyProfit = async (req, res) => {
  try {
    const profitRates = {
      'Plan A': 0.02,
      'Plan B': 0.035,
      'Plan C': 0.05,
    };

    // Find all users with an active plan (not 'None' and not null)
    const users = await User.find({
      $and: [
        { activePlan: { $ne: 'None' } },
        { activePlan: { $ne: null } },
      ],
    });

    if (users.length === 0) {
      return res.status(200).json({ message: 'No users with active plans found for profit distribution' });
    }

    const dateString = new Date().toISOString().split('T')[0];
    const results = [];

    for (const user of users) {
      try {
        const rate = profitRates[user.activePlan];
        if (!rate) {
          console.warn(`Unknown plan: ${user.activePlan} for user ${user._id}`);
          continue;
        }

        const profit = Math.round(user.currentBalance * rate * 100) / 100;
        user.currentBalance += profit;
        await user.save();

        // Create a transaction record for this profit
        const transaction = await Transaction.create({
          user: user._id,
          amount: profit,
          type: 'Deposit',
          transactionId: `ROI-DAILY-${dateString}-${user._id}`,
          status: 'approved',
        });

        results.push({
          userId: user._id,
          userEmail: user.email,
          plan: user.activePlan,
          profit,
          newBalance: user.currentBalance,
          transactionId: transaction._id,
        });
      } catch (userError) {
        console.error(`Failed to distribute profit for user ${user._id}:`, userError.message);
        results.push({
          userId: user._id,
          userEmail: user.email,
          error: userError.message,
        });
      }
    }

    return res.status(200).json({
      message: `Daily ROI distributed successfully to ${users.length} users`,
      distributedTo: results.length,
      results,
    });
  } catch (error) {
    console.error('Daily profit distribution failed:', error.message);
    return res.status(500).json({ message: error.message || 'Daily profit distribution failed' });
  }
};

module.exports = {
  submitDeposit,
  requestWithdrawal,
  selectPlan,
  getTransactions,
  distributeDailyProfit,
};

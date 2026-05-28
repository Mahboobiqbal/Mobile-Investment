const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Plan = require('../models/Plan');
const InvestmentCategory = require('../models/InvestmentCategory');

const submitDeposit = async (req, res) => {
  try {
    const { amount, transactionId } = req.body;
    if (!amount || typeof amount !== 'number' || amount <= 0 || !transactionId) {
      return res.status(400).json({ message: 'A valid positive amount and transactionId are required' });
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
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'A valid positive amount is required' });
    }
    if (!targetPhone) {
      return res.status(400).json({ message: 'targetPhone is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user || user.currentBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance to request withdrawal' });
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      amount,
      type: 'Withdrawal',
      targetPhone,
      status: 'pending',
    });

    return res.status(201).json({ message: 'Withdrawal requested successfully. Awaiting admin processing.', transaction, currentBalance: user.currentBalance });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Withdrawal request failed' });
  }
};

const selectPlan = async (req, res) => {
  try {
    const { planName } = req.body;
    if (!planName) {
      return res.status(400).json({ message: 'planName is required' });
    }

    if (planName !== 'None') {
      const plan = await Plan.findOne({ name: planName, isActive: true });
      if (!plan) {
        return res.status(400).json({ message: 'Invalid or inactive plan' });
      }
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
    const apiKey = req.headers['x-admin-key'];
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(403).json({ message: 'Forbidden. Admin API key required.' });
    }

    const activePlans = await Plan.find({ isActive: true });
    const profitRates = {};
    for (const plan of activePlans) {
      profitRates[plan.name] = plan.dailyReturnRate;
    }

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
          console.warn(`Unknown or inactive plan: ${user.activePlan} for user ${user._id}`);
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

const getActivePlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true })
      .populate('category', 'name slug')
      .select('category name dailyReturnRate minInvestment maxInvestment description');
    return res.status(200).json({ plans });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch plans' });
  }
};

const getActiveCategories = async (req, res) => {
  try {
    const categories = await InvestmentCategory.find({ isActive: true }).sort({ name: 1 });
    return res.status(200).json({ categories });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch categories' });
  }
};

const getCategoryWithPlans = async (req, res) => {
  try {
    const categories = await InvestmentCategory.find({ isActive: true }).sort({ name: 1 });
    const plans = await Plan.find({ isActive: true }).populate('category', 'name slug');

    const result = categories.map((cat) => ({
      ...cat.toObject(),
      plans: plans.filter((p) => p.category && p.category._id.toString() === cat._id.toString()),
    }));

    return res.status(200).json({ systems: result });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch investment systems' });
  }
};

module.exports = {
  submitDeposit,
  requestWithdrawal,
  selectPlan,
  getTransactions,
  distributeDailyProfit,
  getActivePlans,
  getActiveCategories,
  getCategoryWithPlans,
};

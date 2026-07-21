const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Plan = require('../models/Plan');
const InvestmentCategory = require('../models/InvestmentCategory');
const UserInvestment = require('../models/UserInvestment');
const { createAdminNotification } = require('./notificationsController');

const normalizeTransactionType = (value) => String(value || '').toLowerCase();
const MIN_DEPOSIT_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const submitDeposit = async (req, res) => {
  try {
    const { amount, transactionId, planId, planName, investmentAmount, transactionType } = req.body;
    if (!amount || typeof amount !== 'number' || amount <= 0 || !transactionId) {
      return res.status(400).json({ message: 'A valid positive amount and transactionId are required' });
    }

    const existingAuth = await Transaction.findOne({ transactionId });
    if (existingAuth) {
      return res.status(400).json({ message: 'Transaction ID has already been submitted' });
    }
    const user = await User.findById(req.user.id);
    const normalizedType = transactionType ? normalizeTransactionType(transactionType) : (planId ? 'plan' : 'deposit');
    const isPlanPurchase = normalizedType === 'plan';

    let plan = null;
    if (isPlanPurchase) {
      if (!planId) {
        return res.status(400).json({ message: 'planId is required for plan purchases' });
      }

      plan = await Plan.findById(planId).populate('category', 'name');
      if (!plan || !plan.isActive) {
        return res.status(400).json({ message: 'Invalid or inactive plan' });
      }
      if (amount < plan.minInvestment) {
        return res.status(400).json({ message: `Minimum investment for this plan is ${plan.minInvestment}` });
      }
      if (plan.maxInvestment && amount > plan.maxInvestment) {
        return res.status(400).json({ message: `Maximum investment for this plan is ${plan.maxInvestment}` });
      }

      user.pendingPlanId = plan._id;
      user.pendingInvestmentAmount = investmentAmount || amount;
      await user.save();
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      amount,
      type: isPlanPurchase ? 'plan' : 'deposit',
      transactionId,
      status: 'pending',
      planId: isPlanPurchase ? (plan?._id || planId) : null,
      planName: isPlanPurchase ? (plan?.name || planName || '') : '',
      investmentAmount: isPlanPurchase ? (investmentAmount || amount) : 0,
    });

    // Notify admin that a deposit was requested
    try {
      const userData = await User.findById(req.user.id).select('email');
      await createAdminNotification({
        title: isPlanPurchase ? 'New Plan Purchase Requested' : 'New Wallet Deposit Requested',
        message: isPlanPurchase
          ? `Plan purchase request submitted (Plan: ${plan?.name || planName || 'Unknown'}, TID: ${transactionId}, Amount: ${amount}).`
          : `Wallet deposit request submitted (TID: ${transactionId}, Amount: ${amount}).`,
        meta: {
          transactionId,
          amount,
          userId: req.user.id,
          userEmail: userData?.email,
          planId: isPlanPurchase ? (plan?._id || planId || null) : null,
          planName: isPlanPurchase ? (plan?.name || planName || '') : '',
          transactionType: transaction.type,
        },
      });
    } catch (e) {
      // notification failure shouldn't block user flow
      console.error('Failed to create admin notification (deposit):', e.message);
    }

    return res.status(201).json({
      message: isPlanPurchase
        ? 'Plan purchase submitted successfully. Waiting for admin approval.'
        : 'Wallet deposit submitted successfully. Waiting for admin approval.',
      transaction,
    });
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

    const firstDeposit = await Transaction.findOne({
      user: req.user.id,
      type: { $in: ['plan', 'deposit', 'Deposit'] },
      status: { $in: ['approved', 'Approved'] },
      transactionId: { $not: /^ROI-DAILY-/ },
    }).sort({ createdAt: 1 });

    if (!firstDeposit) {
      return res.status(400).json({ message: 'No approved deposits found. Withdrawal requires at least one approved deposit.' });
    }

    const depositAge = Date.now() - new Date(firstDeposit.createdAt).getTime();
    if (depositAge < MIN_DEPOSIT_AGE_MS) {
      const daysLeft = Math.ceil((MIN_DEPOSIT_AGE_MS - depositAge) / (24 * 60 * 60 * 1000));
      return res.status(400).json({ message: `Withdrawals are available 30 days after your first deposit. Please wait ${daysLeft} more day(s).` });
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      amount,
      type: 'withdrawal',
      targetPhone,
      status: 'pending',
    });

    // Notify admin that a withdrawal was requested
    try {
      await createAdminNotification({
        title: 'New Withdrawal Requested',
        message: `Withdrawal request submitted (Amount: ${amount}).`,
        meta: { amount, targetPhone, userId: req.user.id, userEmail: user?.email },
      });
    } catch (e) {
      console.error('Failed to create admin notification (withdrawal):', e.message);
    }

    return res.status(201).json({ message: 'Withdrawal requested successfully. Awaiting admin processing.', transaction, currentBalance: user.currentBalance });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Withdrawal request failed' });
  }
};

const selectPlan = async (req, res) => {
  try {
    const { planId, amount } = req.body;
    
    if (!planId) {
      return res.status(400).json({ message: 'planId is required' });
    }

    const plan = await Plan.findById(planId).populate('category', 'name');
    if (!plan) {
      return res.status(400).json({ message: 'Invalid or inactive plan' });
    }

    const user = await User.findById(req.user.id);
    
    // Store pending plan (don't activate yet - wait for deposit approval)
    user.pendingPlanId = planId;
    user.pendingInvestmentAmount = amount || 0;
    await user.save();

    return res.status(200).json({ message: `Plan ${plan.name} selected. Please complete deposit to activate.`, pendingPlan: plan.name });
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
          type: 'deposit',
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

const checkWithdrawalEligibility = async (req, res) => {
  try {
    const firstDeposit = await Transaction.findOne({
      user: req.user.id,
      type: { $in: ['plan', 'deposit', 'Deposit'] },
      status: { $in: ['approved', 'Approved'] },
      transactionId: { $not: /^ROI-DAILY-/ },
    }).sort({ createdAt: 1 });

    if (!firstDeposit) {
      return res.status(200).json({
        eligible: false,
        daysLeft: 30,
        firstDepositDate: null,
      });
    }

    const depositAge = Date.now() - new Date(firstDeposit.createdAt).getTime();
    const daysLeft = Math.max(0, Math.ceil((MIN_DEPOSIT_AGE_MS - depositAge) / (24 * 60 * 60 * 1000)));

    return res.status(200).json({
      eligible: daysLeft <= 0,
      daysLeft,
      firstDepositDate: firstDeposit.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to check withdrawal eligibility' });
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
  checkWithdrawalEligibility,
};

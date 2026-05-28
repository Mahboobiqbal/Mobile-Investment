const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Plan = require('../models/Plan');
const InvestmentCategory = require('../models/InvestmentCategory');

const getPendingTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ status: 'pending' })
      .populate('user', 'name email phone currentBalance')
      .sort({ createdAt: -1 });
    return res.status(200).json({ transactions });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch pending transactions' });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const { status, page: pageStr, limit: limitStr } = req.query;
    const page = Math.max(1, parseInt(pageStr) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr) || 15));
    const skip = (page - 1) * limit;

    const filter = status ? { status } : {};

    const [transactions, total, counts] = await Promise.all([
      Transaction.find(filter)
        .populate('user', 'name email phone currentBalance')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter),
      Promise.all([
        Transaction.countDocuments({ status: 'pending' }),
        Transaction.countDocuments({ status: 'approved' }),
        Transaction.countDocuments({ status: 'withdrawn' }),
        Transaction.countDocuments({ status: 'rejected' }),
      ]),
    ]);

    return res.status(200).json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
      counts: {
        pending: counts[0],
        approved: counts[1],
        withdrawn: counts[2],
        rejected: counts[3],
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch transactions' });
  }
};

const reviewTransaction = async (req, res) => {
  try {
    const { transactionId, action } = req.body;
    if (!transactionId || !['approve', 'reject', 'withdraw'].includes(action)) {
      return res.status(400).json({ message: 'transactionId and action (approve/reject/withdraw) are required' });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction has already been reviewed' });
    }

    const user = await User.findById(transaction.user);
    if (!user) {
      return res.status(404).json({ message: 'User associated with transaction not found' });
    }

    if (action === 'approve') {
      transaction.status = 'approved';
      if (transaction.type === 'Deposit') {
        user.currentBalance += transaction.amount;
        await user.save();
      }
    } else if (action === 'withdraw') {
      if (transaction.type !== 'Withdrawal') {
        return res.status(400).json({ message: 'Only withdrawal transactions can be marked as withdrawn' });
      }
      if (user.currentBalance < transaction.amount) {
        return res.status(400).json({ message: 'Insufficient balance to process withdrawal' });
      }
      transaction.status = 'withdrawn';
      user.currentBalance -= transaction.amount;
      await user.save();
    } else {
      transaction.status = 'rejected';
    }

    await transaction.save();

    return res.status(200).json({ 
      message: `Transaction ${action}d successfully`, 
      transaction,
      userBalance: user.currentBalance 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to review transaction' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const [users, total, stats] = await Promise.all([
      User.find({}).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments({}),
      Promise.all([
        User.countDocuments({ isVerified: true }),
        User.countDocuments({ activePlan: { $ne: 'None' } }),
        User.aggregate([{ $group: { _id: null, total: { $sum: '$currentBalance' } } }]),
      ]),
    ]);

    return res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        verified: stats[0],
        activePlans: stats[1],
        totalBalance: stats[2][0]?.total || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch users' });
  }
};

const getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 });

    const stats = {
      totalDeposits: transactions
        .filter((t) => t.type === 'Deposit' && t.status === 'approved' && !t.transactionId?.startsWith('ROI-DAILY-'))
        .reduce((sum, t) => sum + t.amount, 0),
      totalWithdrawals: transactions
        .filter((t) => t.type === 'Withdrawal' && (t.status === 'approved' || t.status === 'withdrawn'))
        .reduce((sum, t) => sum + t.amount, 0),
      totalROI: transactions
        .filter((t) => t.transactionId?.startsWith('ROI-DAILY-'))
        .reduce((sum, t) => sum + t.amount, 0),
      pendingDeposits: transactions
        .filter((t) => t.type === 'Deposit' && t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0),
      pendingWithdrawals: transactions
        .filter((t) => t.type === 'Withdrawal' && t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0),
    };

    return res.status(200).json({ user, transactions, stats });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch user details' });
  }
};

const updateUserBalance = async (req, res) => {
  try {
    const { userId, amount, type } = req.body;
    if (!userId || typeof amount !== 'number' || !['add', 'subtract'].includes(type)) {
      return res.status(400).json({ message: 'userId, amount (number), and type (add/subtract) are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (type === 'add') {
      user.currentBalance += amount;
    } else {
      if (user.currentBalance < amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      user.currentBalance -= amount;
    }

    await user.save();
    return res.status(200).json({ message: 'User balance updated successfully', currentBalance: user.currentBalance });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update user balance' });
  }
};

// ─── Category CRUD ─────────────────────────────────────────────

const getCategories = async (req, res) => {
  try {
    const categories = await InvestmentCategory.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ categories });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch categories' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existing = await InvestmentCategory.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }

    const category = await InvestmentCategory.create({ name, description, image });
    return res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, image, isActive } = req.body;

    const category = await InvestmentCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    return res.status(200).json({ message: 'Category updated successfully', category });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const plansCount = await Plan.countDocuments({ category: categoryId });
    if (plansCount > 0) {
      return res.status(400).json({ message: `Cannot delete category. ${plansCount} plan(s) are linked to it. Remove plans first.` });
    }

    const category = await InvestmentCategory.findByIdAndDelete(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete category' });
  }
};

// ─── Plan CRUD (updated with category) ─────────────────────────

const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({}).populate('category', 'name slug').sort({ createdAt: -1 });
    return res.status(200).json({ plans });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch plans' });
  }
};

const createPlan = async (req, res) => {
  try {
    const { category: categoryId, name, dailyReturnRate, minInvestment, maxInvestment, description } = req.body;
    if (!categoryId || !name || dailyReturnRate === undefined) {
      return res.status(400).json({ message: 'category, name, and dailyReturnRate are required' });
    }

    const category = await InvestmentCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const plan = await Plan.create({
      category: categoryId,
      name,
      dailyReturnRate: Number(dailyReturnRate),
      minInvestment: minInvestment ? Number(minInvestment) : 0,
      maxInvestment: maxInvestment ? Number(maxInvestment) : null,
      description: description || '',
    });

    return res.status(201).json({ message: 'Plan created successfully', plan });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A plan with this name already exists in this category' });
    }
    return res.status(500).json({ message: error.message || 'Failed to create plan' });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { category: categoryId, name, dailyReturnRate, minInvestment, maxInvestment, description, isActive } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (categoryId !== undefined) {
      const category = await InvestmentCategory.findById(categoryId);
      if (!category) return res.status(404).json({ message: 'Category not found' });
      plan.category = categoryId;
    }
    if (name !== undefined) plan.name = name;
    if (dailyReturnRate !== undefined) plan.dailyReturnRate = Number(dailyReturnRate);
    if (minInvestment !== undefined) plan.minInvestment = Number(minInvestment);
    if (maxInvestment !== undefined) plan.maxInvestment = maxInvestment ? Number(maxInvestment) : null;
    if (description !== undefined) plan.description = description;
    if (isActive !== undefined) plan.isActive = isActive;

    await plan.save();
    return res.status(200).json({ message: 'Plan updated successfully', plan });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update plan' });
  }
};

const deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await Plan.findByIdAndDelete(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    return res.status(200).json({ message: 'Plan deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete plan' });
  }
};

module.exports = {
  getPendingTransactions,
  getAllTransactions,
  reviewTransaction,
  getAllUsers,
  getUserDetail,
  updateUserBalance,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
};

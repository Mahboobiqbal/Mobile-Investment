const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Plan = require('../models/Plan');
const UserInvestment = require('../models/UserInvestment');

async function syncUserPlanState(userId, userDoc = null) {
  const user = userDoc || await User.findById(userId);

  if (!user) {
    return null;
  }

  const activeInvestment = await UserInvestment.findOne({ user: userId, status: 'active' })
    .populate('plan', 'name dailyReturnRate minInvestment maxInvestment description')
    .populate('category', 'name');

  if (activeInvestment?.plan?.name) {
    const activeCategoryId = activeInvestment.category?._id || null;

    if (
      user.activePlan !== activeInvestment.plan.name ||
      String(user.activeCategory || '') !== String(activeCategoryId || '') ||
      user.pendingPlanId ||
      user.pendingInvestmentAmount
    ) {
      user.activePlan = activeInvestment.plan.name;
      user.activeCategory = activeCategoryId;
      user.pendingPlanId = null;
      user.pendingInvestmentAmount = 0;
      await user.save();
    }

    return user;
  }

  const approvedPlanDeposit = await Transaction.findOne({
    user: userId,
    type: { $in: ['plan', 'deposit', 'Deposit'] },
    status: { $in: ['approved', 'Approved'] },
    transactionId: { $not: /^ROI-DAILY-/ },
    $or: [
      { planId: { $ne: null } },
      { planName: { $exists: true, $nin: ['', null] } },
    ],
  }).sort({ updatedAt: -1, createdAt: -1 });

  if (!approvedPlanDeposit) {
    return user;
  }

  const plan = approvedPlanDeposit.planId
    ? await Plan.findById(approvedPlanDeposit.planId).populate('category', 'name')
    : await Plan.findOne({ name: approvedPlanDeposit.planName }).populate('category', 'name');

  if (!plan || !plan.category?._id) {
    return user;
  }

  await UserInvestment.findOneAndUpdate(
    { user: userId, plan: plan._id },
    {
      user: userId,
      plan: plan._id,
      category: plan.category._id,
      investmentAmount: approvedPlanDeposit.investmentAmount || approvedPlanDeposit.amount,
      dailyReturnRate: plan.dailyReturnRate,
      status: 'active',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  user.activePlan = plan.name;
  user.activeCategory = plan.category._id;
  user.pendingPlanId = null;
  user.pendingInvestmentAmount = 0;
  await user.save();

  approvedPlanDeposit.planId = plan._id;
  approvedPlanDeposit.planName = plan.name;
  await approvedPlanDeposit.save();

  return user;
}

module.exports = {
  syncUserPlanState,
};
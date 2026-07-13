require('dotenv').config();

const connectDb = require('../config/db');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { syncUserPlanState } = require('../utils/planState');

const normalizeType = (value) => String(value || '').toLowerCase();

async function run() {
  await connectDb();

  const transactions = await Transaction.find({
    type: { $in: ['Deposit', 'Withdrawal', 'deposit', 'withdrawal', 'plan'] },
  }).sort({ createdAt: 1 });

  let updatedCount = 0;

  for (const transaction of transactions) {
    const currentType = normalizeType(transaction.type);
    let nextType = currentType;

    if (currentType === 'deposit' || currentType === 'deposit'.toUpperCase()) {
      if (transaction.planId || transaction.planName) {
        nextType = 'plan';
      } else if (transaction.transactionId?.startsWith('ROI-DAILY-')) {
        nextType = 'deposit';
      } else {
        nextType = 'deposit';
      }
    } else if (currentType === 'withdrawal') {
      nextType = 'withdrawal';
    } else if (currentType === 'plan') {
      nextType = 'plan';
    }

    const nextPlanId = nextType === 'plan' ? transaction.planId || null : null;
    const nextPlanName = nextType === 'plan' ? transaction.planName || '' : '';
    const nextInvestmentAmount = nextType === 'plan' ? transaction.investmentAmount || transaction.amount : 0;

    const shouldUpdate =
      transaction.type !== nextType ||
      String(transaction.planId || '') !== String(nextPlanId || '') ||
      (transaction.planName || '') !== nextPlanName ||
      transaction.investmentAmount !== nextInvestmentAmount;

    if (!shouldUpdate) {
      continue;
    }

    transaction.type = nextType;
    transaction.planId = nextPlanId;
    transaction.planName = nextPlanName;
    transaction.investmentAmount = nextInvestmentAmount;
    await transaction.save();
    updatedCount += 1;
  }

  console.log(`Transaction type migration completed. Updated ${updatedCount} record(s).`);

  const users = await User.find({});
  let syncedUsers = 0;

  for (const user of users) {
    const beforeActivePlan = user.activePlan;
    const beforeActiveCategory = String(user.activeCategory || '');
    const beforePendingPlanId = String(user.pendingPlanId || '');
    const beforePendingInvestmentAmount = user.pendingInvestmentAmount || 0;

    const syncedUser = await syncUserPlanState(user._id, user);
    if (!syncedUser) {
      continue;
    }

    const afterActivePlan = syncedUser.activePlan;
    const afterActiveCategory = String(syncedUser.activeCategory || '');
    const afterPendingPlanId = String(syncedUser.pendingPlanId || '');
    const afterPendingInvestmentAmount = syncedUser.pendingInvestmentAmount || 0;

    if (
      beforeActivePlan !== afterActivePlan ||
      beforeActiveCategory !== afterActiveCategory ||
      beforePendingPlanId !== afterPendingPlanId ||
      beforePendingInvestmentAmount !== afterPendingInvestmentAmount
    ) {
      syncedUsers += 1;
    }
  }

  console.log(`User plan state sync completed. Updated ${syncedUsers} record(s).`);
  process.exit(0);
}

run().catch((error) => {
  console.error('Transaction type migration failed:', error);
  process.exit(1);
});
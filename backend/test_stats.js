require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGO_URI_DIRECT);

  const User = require('./models/User');
  const Transaction = require('./models/Transaction');
  const UserInvestment = require('./models/UserInvestment');
  const DailyProfitRate = require('./models/DailyProfitRate');

  const userId = '6a5f5c77b74f7aa6bf739785';

  const [stats, investments, user, dailyConfig] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $facet: {
          totalDepositsApproved: [
            { $match: { type: { $in: ['plan', 'deposit', 'Deposit'] }, status: { $in: ['approved', 'Approved'] }, transactionId: { $not: /^ROI-DAILY-/ } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ],
          totalWithdrawalsProcessed: [
            { $match: { type: { $in: ['withdrawal', 'Withdrawal'] }, status: { $in: ['approved', 'Approved', 'withdrawn', 'Withdrawn'] } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ],
          totalROIEarnings: [
            { $match: { type: { $in: ['deposit', 'Deposit'] }, transactionId: /^ROI-DAILY-/ } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ],
      } }
    ]),
    UserInvestment.find({ user: userId, status: 'active' }).select('investmentAmount'),
    User.findById(userId).select('currentBalance'),
    DailyProfitRate.findOne({ date: new Date().toISOString().split('T')[0] }),
  ]);

  const summary = stats[0] || {};
  const totalInvestment = investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
  const dailyRate = dailyConfig ? dailyConfig.rate : 0.005;

  console.log('Response that frontend receives:');
  console.log(JSON.stringify({
    totalDepositsApproved: summary.totalDepositsApproved?.[0]?.total || 0,
    totalWithdrawalsApproved: summary.totalWithdrawalsProcessed?.[0]?.total || 0,
    totalROIEarnings: summary.totalROIEarnings?.[0]?.total || 0,
    totalInvestment,
    currentBalance: user?.currentBalance,
    dailyRate,
  }, null, 2));

  await mongoose.disconnect();
}
check().catch(console.error);

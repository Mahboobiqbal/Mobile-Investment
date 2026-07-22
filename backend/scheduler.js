const cron = require('node-cron');
const { runDailyProfitDistribution } = require('./controllers/walletController');

const startScheduler = () => {
  // Run daily profit distribution at midnight every day
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Running daily profit distribution...');
    try {
      const result = await runDailyProfitDistribution();
      console.log(`[Scheduler] ${result.message}`);
    } catch (error) {
      console.error('[Scheduler] Daily profit distribution failed:', error.message);
    }
  }, {
    timezone: 'Asia/Karachi',
  });

  console.log('[Scheduler] Daily profit distribution scheduled for midnight (Asia/Karachi)');
};

module.exports = startScheduler;

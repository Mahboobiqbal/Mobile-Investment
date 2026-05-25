const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Transaction = require('./models/Transaction');

async function testROIWithBalance() {
  try {
    const mongoUri = process.env.MONGO_URI_DIRECT || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Step 1: Find a user with an active plan and set their balance
    console.log('\n--- Step 1: Setting up test user with balance ---');
    let users = await User.find({});
    let user = users.find(u => u.activePlan && u.activePlan !== 'None');
    if (!user) {
      console.log('No user with active plan found. Creating one...');
      user = await User.create({
        name: 'ROI Test',
        email: 'roitest' + Date.now() + '@example.com',
        password: 'test',
        phone: '03001234567',
        activePlan: 'Plan A',
      });
    }

    console.log('User before:', { email: user.email, activePlan: user.activePlan, balance: user.currentBalance });
    user.currentBalance = 1000;
    await user.save();
    console.log('User after balance update:', { email: user.email, activePlan: user.activePlan, balance: user.currentBalance });

    // Step 2: Now trigger ROI via the API
    console.log('\n--- Step 2: Triggering Daily ROI ---');
    let reg = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin',
        email: 'admin' + Date.now() + '@example.com',
        password: 'securepassword123',
        phone: '03001234567',
      }),
    });
    let regData = await reg.json();
    const token = regData.token;

    let roiRes = await fetch('http://localhost:5000/api/wallet/trigger-daily-roi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({}),
    });
    let roiData = await roiRes.json();
    console.log('ROI Results:', JSON.stringify(roiData.results, null, 2));

    // Step 3: Fetch updated balance from DB
    console.log('\n--- Step 3: Checking updated user balance ---');
    user = await User.findById(user._id);
    console.log('User after ROI:', { email: user.email, activePlan: user.activePlan, newBalance: user.currentBalance });

    // Step 4: Check transactions
    console.log('\n--- Step 4: Checking ROI transactions ---');
    let trans = await Transaction.find({ user: user._id, type: 'Deposit', status: 'approved' }).sort({ createdAt: -1 });
    if (trans.length > 0) {
      console.log('ROI Transactions:');
      trans.forEach(t => {
        console.log({ amount: t.amount, status: t.status, transId: t.transactionId, date: t.createdAt });
      });
    } else {
      console.log('No ROI transactions found');
    }

    await mongoose.disconnect();
    console.log('\n✓ Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

testROIWithBalance();

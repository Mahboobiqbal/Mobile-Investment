const express = require('express');
const { submitDeposit, requestWithdrawal, selectPlan, getTransactions, distributeDailyProfit, getActivePlans, getActiveCategories, getCategoryWithPlans, checkWithdrawalEligibility } = require('../controllers/walletController');
const { requestMutualFundRedemption, getUserMutualFundRequests } = require('../controllers/mutualFundController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @openapi
 * /wallet/categories:
 *   get:
 *     tags: [Wallet - Public]
 *     summary: Get active investment categories
 *     security: []
 *     responses:
 *       200:
 *         description: List of active categories
 */
router.get('/categories', getActiveCategories);

/**
 * @openapi
 * /wallet/systems:
 *   get:
 *     tags: [Wallet - Public]
 *     summary: Get categories with their plans
 *     security: []
 *     responses:
 *       200:
 *         description: Systems with nested plans
 */
router.get('/systems', getCategoryWithPlans);

/**
 * @openapi
 * /wallet/plans:
 *   get:
 *     tags: [Wallet - Public]
 *     summary: Get all active plans
 *     security: []
 *     responses:
 *       200:
 *         description: List of active plans
 */
router.get('/plans', getActivePlans);

/**
 * @openapi
 * /wallet/trigger-daily-roi:
 *   post:
 *     tags: [Wallet - Admin]
 *     summary: Trigger daily ROI distribution
 *     security: [{ adminApiKey: [] }]
 *     responses:
 *       200:
 *         description: ROI distributed
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.post('/trigger-daily-roi', distributeDailyProfit);

router.use(authMiddleware);

/**
 * @openapi
 * /wallet/deposit:
 *   post:
 *     tags: [Wallet - Auth]
 *     summary: Submit a deposit request
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, transactionId]
 *             properties:
 *               amount: { type: number, minimum: 1 }
 *               transactionId: { type: string }
 *     responses:
 *       201:
 *         description: Deposit submitted, pending approval
 */
router.post('/deposit', submitDeposit);

/**
 * @openapi
 * /wallet/withdraw:
 *   post:
 *     tags: [Wallet - Auth]
 *     summary: Request a withdrawal
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, targetPhone]
 *             properties:
 *               amount: { type: number, minimum: 1 }
 *               targetPhone: { type: string }
 *     responses:
 *       201:
 *         description: Withdrawal requested, pending admin processing
 */
router.post('/withdraw', requestWithdrawal);

/**
 * @openapi
 * /wallet/withdrawal-eligibility:
 *   get:
 *     tags: [Wallet - Auth]
 *     summary: Check if the user is eligible to withdraw (30-day lock since first deposit)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Eligibility status with days remaining
 */
router.get('/withdrawal-eligibility', checkWithdrawalEligibility);

/**
 * @openapi
 * /wallet/select-plan:
 *   post:
 *     tags: [Wallet - Auth]
 *     summary: Select an investment plan
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planName]
 *             properties:
 *               planName: { type: string }
 *     responses:
 *       200:
 *         description: Plan selected successfully
 */
router.post('/select-plan', selectPlan);

/**
 * @openapi
 * /wallet/transactions:
 *   get:
 *     tags: [Wallet - Auth]
 *     summary: Get user's transactions
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of user transactions
 */
router.get('/transactions', getTransactions);

/**
 * @openapi
 * /wallet/mutual-funds/request:
 *   post:
 *     tags: [Wallet - Auth]
 *     summary: Request mutual fund redemption (account ≥ 1 month, amount > 500)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number, minimum: 501 }
 *     responses:
 *       201:
 *         description: Redemption request submitted
 *       400:
 *         description: Validation error (account age / amount / balance)
 */
router.post('/mutual-funds/request', requestMutualFundRedemption);

/**
 * @openapi
 * /wallet/mutual-funds/requests:
 *   get:
 *     tags: [Wallet - Auth]
 *     summary: Get user's mutual fund requests
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of user's mutual fund requests
 */
router.get('/mutual-funds/requests', getUserMutualFundRequests);

module.exports = router;

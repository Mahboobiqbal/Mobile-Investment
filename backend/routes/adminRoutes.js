const express = require('express');
const {
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
  getDashboardAnalytics,
  getDailyProfitRate,
  setDailyProfitRate,
} = require('../controllers/adminController');
const {
  getAllMutualFundRequests,
  reviewMutualFundRequest,
} = require('../controllers/mutualFundController');

const router = express.Router();

const { createAdminPost } = require('../controllers/postsController');

/**
 * @openapi
 * /admin/pending-transactions:
 *   get:
 *     tags: [Admin]
 *     summary: Get all pending transactions
 *     security: [{ adminApiKey: [] }]
 *     responses:
 *       200:
 *         description: List of pending transactions
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.get('/pending-transactions', getPendingTransactions);

/**
 * @openapi
 * /admin/transactions:
 *   get:
 *     tags: [Admin]
 *     summary: Get all transactions with pagination and status filter
 *     security: [{ adminApiKey: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected, withdrawn] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 15 }
 *     responses:
 *       200:
 *         description: Paginated transactions with counts
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.get('/transactions', getAllTransactions);

/**
 * @openapi
 * /admin/review-transaction:
 *   post:
 *     tags: [Admin]
 *     summary: Approve or reject a transaction
 *     security: [{ adminApiKey: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionId, action]
 *             properties:
 *               transactionId: { type: string }
 *               action: { type: string, enum: [approve, reject, withdraw] }
 *     responses:
 *       200:
 *         description: Transaction reviewed
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.post('/review-transaction', reviewTransaction);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users with pagination and stats
 *     security: [{ adminApiKey: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Paginated users with aggregate stats
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.get('/users', getAllUsers);

/**
 * @openapi
 * /admin/users/{userId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get single user detail with transactions and stats
 *     security: [{ adminApiKey: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User detail with transactions
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.get('/users/:userId', getUserDetail);

/**
 * @openapi
 * /admin/update-balance:
 *   post:
 *     tags: [Admin]
 *     summary: Manually update a user's balance
 *     security: [{ adminApiKey: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, amount, type]
 *             properties:
 *               userId: { type: string }
 *               amount: { type: number }
 *               type: { type: string, enum: [add, subtract] }
 *     responses:
 *       200:
 *         description: Balance updated
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.post('/update-balance', updateUserBalance);

/**
 * @openapi
 * /admin/categories:
 *   get:
 *     tags: [Admin - Categories]
 *     summary: Get all investment categories
 *     security: [{ adminApiKey: [] }]
 *     responses:
 *       200:
 *         description: List of categories
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.get('/categories', getCategories);

/**
 * @openapi
 * /admin/categories:
 *   post:
 *     tags: [Admin - Categories]
 *     summary: Create a new investment category
 *     security: [{ adminApiKey: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Category created
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.post('/categories', createCategory);

/**
 * @openapi
 * /admin/categories/{categoryId}:
 *   put:
 *     tags: [Admin - Categories]
 *     summary: Update a category
 *     security: [{ adminApiKey: [] }]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Category updated
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.put('/categories/:categoryId', updateCategory);

/**
 * @openapi
 * /admin/categories/{categoryId}:
 *   delete:
 *     tags: [Admin - Categories]
 *     summary: Delete a category (plans must be removed first)
 *     security: [{ adminApiKey: [] }]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category deleted
 *       400:
 *         description: Category has linked plans
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.delete('/categories/:categoryId', deleteCategory);

/**
 * @openapi
 * /admin/plans:
 *   get:
 *     tags: [Admin - Plans]
 *     summary: Get all plans with category info
 *     security: [{ adminApiKey: [] }]
 *     responses:
 *       200:
 *         description: List of plans
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.get('/plans', getPlans);

/**
 * @openapi
 * /admin/plans:
 *   post:
 *     tags: [Admin - Plans]
 *     summary: Create a new plan
 *     security: [{ adminApiKey: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, name, dailyReturnRate]
 *             properties:
 *               category: { type: string, description: Category ID }
 *               name: { type: string }
 *               dailyReturnRate: { type: number, description: e.g. 0.02 for 2% }
 *               minInvestment: { type: number, default: 0 }
 *               maxInvestment: { type: number, nullable: true }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Plan created
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.post('/plans', createPlan);

/**
 * @openapi
 * /admin/plans/{planId}:
 *   put:
 *     tags: [Admin - Plans]
 *     summary: Update a plan
 *     security: [{ adminApiKey: [] }]
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               dailyReturnRate: { type: number }
 *               minInvestment: { type: number }
 *               maxInvestment: { type: number, nullable: true }
 *               description: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Plan updated
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.put('/plans/:planId', updatePlan);

/**
 * @openapi
 * /admin/plans/{planId}:
 *   delete:
 *     tags: [Admin - Plans]
 *     summary: Delete a plan
 *     security: [{ adminApiKey: [] }]
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Plan deleted
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.delete('/plans/:planId', deletePlan);

/**
 * @openapi
 * /admin/analytics:
 *   get:
 *     tags: [Admin - Analytics]
 *     summary: Get dashboard analytics with charts data
 *     security: [{ adminApiKey: [] }]
 *     responses:
 *       200:
 *         description: Analytics data for dashboard
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.get('/analytics', getDashboardAnalytics);

/**
 * @openapi
 * /admin/daily-profit-rate:
 *   get:
 *     tags: [Admin - Daily Profit]
 *     summary: Get today's daily profit rate (default 0.5%)
 *     security: [{ adminApiKey: [] }]
 *     responses:
 *       200:
 *         description: Today's profit rate
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.get('/daily-profit-rate', getDailyProfitRate);

/**
 * @openapi
 * /admin/daily-profit-rate:
 *   post:
 *     tags: [Admin - Daily Profit]
 *     summary: Set today's daily profit rate (resets to 0.5% next day)
 *     security: [{ adminApiKey: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rate]
 *             properties:
 *               rate: { type: number, description: "Percentage value (e.g. 1.5 for 1.5%)" }
 *     responses:
 *       200:
 *         description: Daily profit rate updated
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.post('/daily-profit-rate', setDailyProfitRate);

/**
 * @openapi
 * /admin/mutual-funds/requests:
 *   get:
 *     tags: [Admin - Mutual Funds]
 *     summary: Get all mutual fund redemption requests
 *     security: [{ adminApiKey: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected] }
 *     responses:
 *       200:
 *         description: List of mutual fund requests with user data
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.get('/mutual-funds/requests', getAllMutualFundRequests);

/**
 * @openapi
 * /admin/mutual-funds/review:
 *   post:
 *     tags: [Admin - Mutual Funds]
 *     summary: Approve or reject a mutual fund redemption request
 *     security: [{ adminApiKey: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestId, action]
 *             properties:
 *               requestId: { type: string }
 *               action: { type: string, enum: [approve, reject] }
 *               adminNote: { type: string }
 *     responses:
 *       200:
 *         description: Request reviewed
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - valid admin API key required
 */
router.post('/mutual-funds/review', reviewMutualFundRequest);

/**
 * @openapi
 * /admin/posts:
 *   post:
 *     tags: [Admin - Posts]
 *     summary: Create a community post
 *     security: [{ adminApiKey: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, body]
 *             properties:
 *               title: { type: string }
 *               body: { type: string }
 *               category: { type: string, enum: [update, announcement, education] }
 *               isPublished: { type: boolean }
 *     responses:
 *       201:
 *         description: Post created
 */
router.post('/posts', createAdminPost);

module.exports = router;

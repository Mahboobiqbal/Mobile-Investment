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
} = require('../controllers/adminController');
const {
  getAllMutualFundRequests,
  reviewMutualFundRequest,
} = require('../controllers/mutualFundController');

const router = express.Router();

/**
 * @openapi
 * /admin/pending-transactions:
 *   get:
 *     tags: [Admin]
 *     summary: Get all pending transactions
 *     responses:
 *       200:
 *         description: List of pending transactions
 */
router.get('/pending-transactions', getPendingTransactions);

/**
 * @openapi
 * /admin/transactions:
 *   get:
 *     tags: [Admin]
 *     summary: Get all transactions with pagination and status filter
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
 */
router.get('/transactions', getAllTransactions);

/**
 * @openapi
 * /admin/review-transaction:
 *   post:
 *     tags: [Admin]
 *     summary: Approve or reject a transaction
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
 */
router.post('/review-transaction', reviewTransaction);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users with pagination and stats
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
 */
router.get('/users', getAllUsers);

/**
 * @openapi
 * /admin/users/{userId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get single user detail with transactions and stats
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User detail with transactions
 */
router.get('/users/:userId', getUserDetail);

/**
 * @openapi
 * /admin/update-balance:
 *   post:
 *     tags: [Admin]
 *     summary: Manually update a user's balance
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
 */
router.post('/update-balance', updateUserBalance);

/**
 * @openapi
 * /admin/categories:
 *   get:
 *     tags: [Admin - Categories]
 *     summary: Get all investment categories
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', getCategories);

/**
 * @openapi
 * /admin/categories:
 *   post:
 *     tags: [Admin - Categories]
 *     summary: Create a new investment category
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
 */
router.post('/categories', createCategory);

/**
 * @openapi
 * /admin/categories/{categoryId}:
 *   put:
 *     tags: [Admin - Categories]
 *     summary: Update a category
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
 */
router.put('/categories/:categoryId', updateCategory);

/**
 * @openapi
 * /admin/categories/{categoryId}:
 *   delete:
 *     tags: [Admin - Categories]
 *     summary: Delete a category (plans must be removed first)
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
 */
router.delete('/categories/:categoryId', deleteCategory);

/**
 * @openapi
 * /admin/plans:
 *   get:
 *     tags: [Admin - Plans]
 *     summary: Get all plans with category info
 *     responses:
 *       200:
 *         description: List of plans
 */
router.get('/plans', getPlans);

/**
 * @openapi
 * /admin/plans:
 *   post:
 *     tags: [Admin - Plans]
 *     summary: Create a new plan
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
 */
router.post('/plans', createPlan);

/**
 * @openapi
 * /admin/plans/{planId}:
 *   put:
 *     tags: [Admin - Plans]
 *     summary: Update a plan
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
 */
router.put('/plans/:planId', updatePlan);

/**
 * @openapi
 * /admin/plans/{planId}:
 *   delete:
 *     tags: [Admin - Plans]
 *     summary: Delete a plan
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Plan deleted
 */
router.delete('/plans/:planId', deletePlan);

/**
 * @openapi
 * /admin/mutual-funds/requests:
 *   get:
 *     tags: [Admin - Mutual Funds]
 *     summary: Get all mutual fund redemption requests
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected] }
 *     responses:
 *       200:
 *         description: List of mutual fund requests with user data
 */
router.get('/mutual-funds/requests', getAllMutualFundRequests);

/**
 * @openapi
 * /admin/mutual-funds/review:
 *   post:
 *     tags: [Admin - Mutual Funds]
 *     summary: Approve or reject a mutual fund redemption request
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
 */
router.post('/mutual-funds/review', reviewMutualFundRequest);

module.exports = router;

require('dotenv').config();

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const connectDb = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');

const swaggerSpec = require('./swagger');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'https://investintrees.vercel.app'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/wallet', apiLimiter, walletRoutes);
const adminAuthMiddleware = require('./middleware/adminAuthMiddleware');
app.use('/api/admin', adminAuthMiddleware, adminRoutes);
app.use('/api/admin', adminAuthMiddleware, notificationsRoutes);


// Public community routes
const postsRoutes = require('./routes/postsRoutes');
app.use('/api/community', postsRoutes);

app.get('/', (req, res) => {
	res.status(200).json({
		message: 'API is secured and running',
		uptime: process.uptime(),
	});
});

const startServer = async () => {
	try {
		await connectDb();

		const port = process.env.PORT || 5000;
		app.listen(port, () => {
			console.log(`Server running on port ${port}`);
		});
	} catch (error) {
		console.error('Server startup failed:', error.message);
		process.exit(1);
	}
};

startServer();

module.exports = app;

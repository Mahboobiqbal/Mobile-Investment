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
const startScheduler = require('./scheduler');

const swaggerSpec = require('./swagger');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://investintrees.vercel.app']
    : true,
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


// Public settings route
const Settings = require('./models/Settings');
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'global' });
    if (!settings) {
      settings = await Settings.create({ key: 'global' });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

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

		startScheduler();
	} catch (error) {
		console.error('Server startup failed:', error.message);
		process.exit(1);
	}
};

startServer();

module.exports = app;

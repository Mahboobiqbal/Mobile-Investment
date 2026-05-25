require('dotenv').config();

const cors = require('cors');
const express = require('express');

const connectDb = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/', (req, res) => {
	res.status(200).json({
		message: 'API is running',
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

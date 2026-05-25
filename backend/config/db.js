const mongoose = require('mongoose');

const connectDb = async () => {
  const mongoUri = process.env.MONGO_URI_DIRECT || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in the environment');
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' && error.syscall === 'querySrv') {
      console.error(
        'MongoDB SRV lookup failed in Node.js. Your DNS can resolve the Atlas record from Windows, but the Node driver cannot. Use a standard mongodb:// connection string from MongoDB Atlas or set MONGO_URI_DIRECT in .env.'
      );
    }

    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

module.exports = connectDb;

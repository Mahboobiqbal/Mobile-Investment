const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Name is required'],
			trim: true,
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true,
			trim: true,
			lowercase: true,
			match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
		},
		password: {
			type: String,
			required: [true, 'Password is required'],
			minlength: [6, 'Password must be at least 6 characters long'],
			select: false,
		},
		phone: {
			type: String,
			required: [true, 'Phone number is required'],
			trim: true,
		},
		dp: {
			type: String,
			default: 'https://www.gravatar.com/avatar/?d=mp',
		},
		role: {
			type: String,
			enum: ['user', 'admin'],
			default: 'user',
		},
		currentBalance: {
			type: Number,
			default: 0,
		},
		activePlan: {
			type: String,
			enum: ['None', 'Plan A', 'Plan B', 'Plan C'],
			default: 'None',
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		otpCode: {
			type: String,
			default: null,
		},
		otpExpires: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('User', userSchema);

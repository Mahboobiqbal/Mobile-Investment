# Backend Structure

Professional Node.js + Express + MongoDB backend using an MVC-style layout.

## Tree

backend/
├─ config/
│  └─ db.js
├─ controllers/
│  ├─ authController.js
│  ├─ walletController.js
│  └─ adminController.js
├─ middleware/
│  ├─ authMiddleware.js
│  ├─ adminMiddleware.js
│  └─ validationMiddleware.js
├─ models/
│  ├─ User.js
│  ├─ Transaction.js
│  └─ Plan.js
├─ routes/
│  ├─ authRoutes.js
│  ├─ walletRoutes.js
│  └─ adminRoutes.js
├─ utils/
│  ├─ sendEmail.js
│  └─ asyncHandler.js
├─ .env
├─ .gitignore
├─ package.json
└─ server.js

## What each directory contains

- `config/` contains infrastructure setup such as the MongoDB connection and environment-driven configuration.
- `controllers/` contains request handlers and business logic for authentication, wallet operations, and admin actions.
- `middleware/` contains route guards and request validation for JWT auth, admin role checks, and payload validation.
- `models/` contains Mongoose schemas for users, transactions, and investment plans.
- `routes/` contains Express route definitions that connect HTTP endpoints to controllers.
- `utils/` contains reusable helper functions such as OTP email delivery and async error wrappers.
- `.env` stores secrets and runtime settings such as `MONGO_URI` and `JWT_SECRET`.
- `.gitignore` excludes sensitive files and build artifacts like `node_modules` and `.env`.
- `package.json` defines dependencies, scripts, and project metadata.
- `server.js` boots Express, connects to MongoDB, loads middleware, mounts routes, and starts the server.

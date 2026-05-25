# Master Project Roadmap: Wallet & Investment App

## Phase 1: Project Initialization & Environment Setup
- [ ] 1.1 Backend Setup: Initialize Node.js project (`npm init`), install dependencies (`express`, `mongoose`, `dotenv`, `cors`, `bcryptjs`, `jsonwebtoken`).
- [ ] 1.2 Database Setup: Configure a free MongoDB Atlas cluster and whitelist your IP address.
- [ ] 1.3 Frontend Setup: Initialize the React Native app (using Expo or CLI) inside the `frontend/` directory.
- [ ] 1.4 Environment Variables: Create `.env` files for both backend (DB URL, JWT Secret) and frontend (Backend Base API URL).

## Phase 2: Backend Development (Node.js & Express)

### 2.1 Database Schemas (Models)
- [ ] Create `User.js` Schema (Name, Email, Password, Phone, Profile Pic, Balance, Active Plan, Role).
- [ ] Create `Transaction.js` Schema (User ID, Amount, Type [Deposit/Withdrawal], Transaction ID [TID], Status [Pending/Approved/Rejected], Timestamp).
- [ ] Create `Plan.js` Schema (Plan Name, Min/Max Investment, Return Rate, Terms Reference).

### 2.2 Authentication & User APIs
- [ ] Build Signup API (with password hashing using `bcryptjs`).
- [ ] Build Login API (returns a secure JWT token).
- [ ] Build OTP Mock/Service for email verification.
- [ ] Build Fetch User Profile API (to get current balance and active plan status).

### 2.3 Financial Transaction APIs
- [ ] Build Submit Deposit API (accepts amount and user-provided Easypaisa Transaction ID; sets status to pending).
- [ ] Build Request Withdrawal API (deducts/locks amount from user balance, creates a pending withdrawal log).
- [ ] Build Transaction History API (fetches past deposits/withdrawals for the logged-in user).

## Phase 3: Frontend Development (React Native)

### 3.1 Architecture & Navigation
- [ ] Set up the `frontend/src/` folder structure.
- [ ] Configure React Navigation (`@react-navigation/native`).
- [ ] Auth Stack: Login, Signup, OTP Verification screens.
- [ ] App Stack: Dashboard, Plan Selection, Calculator, Wallet/Balance screens.
- [ ] Set up Global Authentication Context (to hold user login state, JWT, and balance globally).

### 3.2 UI Integration - Onboarding
- [ ] Design and connect Signup Screen to Backend API.
- [ ] Design and connect Login Screen (saves JWT securely upon success).
- [ ] Implement automatic route switching (if token exists -> go to App Stack, else -> Auth Stack).

### 3.3 UI Integration - Dashboard & Plans
- [ ] Design Home Dashboard Screen showing User Profile and Current Balance.
- [ ] Create Investment Plans Component (pop-up or modal displaying Plan A, Plan B, Plan C).
- [ ] Build Terms & Conditions Screen that users must accept before selecting a plan.
- [ ] Connect plan selection to backend to update user's `activePlan` status.

### 3.4 UI Integration - Wallet (Easypaisa Flow)
- [ ] Design Balance Screen showing total funds, current earnings, and transaction logs.
- [ ] Build Top-up Modal/Screen.
- [ ] Display the project's official Easypaisa account details (Number & Name).
- [ ] Provide an input field for the user to type in their Easypaisa Transaction ID (TID) and Amount.
- [ ] Connect to Submit Deposit API.
- [ ] Build Withdrawal Screen (input fields for amount, target Easypaisa phone number, and a submit button).

### 3.5 UI Integration - Calculator Suite
- [ ] Build Many Calculator Screen (an interactive tab where users can input different values to compute projected returns based on their chosen investment plans).

## Phase 4: Admin Panel (Basic Hooks)
- [ ] Build Backend Admin Route Middleware (protects routes so only users with role: `admin` can access them).
- [ ] Build Admin Pending Transactions API (lists all deposits and withdrawals where status is `pending`).
- [ ] Build Approve/Reject Deposit API (updating a TID to approved automatically adds the amount to the target user's current balance).
- [ ] Build Approve/Reject Withdrawal API.

## Phase 5: Testing, Security & Optimization
- [ ] API Security: Ensure users cannot modify other users' balances via Postman (verify JWT middleware on all financial endpoints).
- [ ] Validation Testing: Test entering a fake/duplicate Transaction ID to ensure the backend requires unique TIDs.
- [ ] UI Polish: Add loading indicators (spinners) during API calls and clear alert messages for successful deposits/withdrawals.

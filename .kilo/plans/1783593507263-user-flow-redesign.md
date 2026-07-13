# Mobile Investment App - User Flow Redesign Implementation Plan

## Project Overview
Transform the post-login user flow from landing on Dashboard → redirect to Plans page with mandatory plan selection → Terms & Conditions → Deposit submission with transaction ID → Admin approval → User sees plans & transaction history.

## Current Flow (to modify)
1. User logs in → DashboardScreen (balance, investments, analytics)
2. User can navigate to Systems → Plans → Terms → Deposit
3. Deposit submitted with transaction ID → Admin reviews → Approves/Rejects

## Target Flow
1. **Login/Register** → **PlanSelectionScreen** (mandatory, no skip)
2. **PlanSelectionScreen** - Show all plans with: investment amount, daily return %, min/max investment, description
3. User selects plan → **TermsConditionScreen** (updated with selected plan details)
4. **TermsConditionScreen** - Agree & Continue → **DepositRequestScreen** 
5. **DepositRequestScreen** - User enters investment amount + transaction ID
6. Admin reviews transaction in admin panel → Approve/Reject
7. On approval → User sees **DashboardScreen** with selected plan active + transaction history

---

## Implementation Tasks

### Phase 1: Navigation & Auth Flow Changes
- [ ] **1.1** Modify `AppNavigator.tsx` - Change initial route after login from `MainTabs` (Dashboard) to `PlanSelection`
- [ ] **1.2** Update `AuthContext.tsx` - Ensure `login()` navigates to PlanSelection instead of Dashboard
- [ ] **1.3** Add navigation guard - If user has no active plan, force redirect to PlanSelection
- [ ] **1.4** Update `RootStackParamList` types for new flow

### Phase 2: PlanSelectionScreen Enhancement
- [ ] **2.1** Fetch plans grouped by system/category from `/wallet/systems` endpoint
- [ ] **2.2** Display plan cards with: Plan Name, Category, Daily Return %, Min Investment, Max Investment, Description
- [ ] **2.3** Add investment calculator preview: "Invest Rs. X → Get Rs. Y daily"
- [ ] **2.4** Make plan selection mandatory (disable continue without selection)
- [ ] **2.5** Pass selected plan + calculated values to TermsConditionScreen

### Phase 3: TermsConditionScreen Updates
- [ ] **3.1** Display selected plan details at top (name, daily return, min/max investment)
- [ ] **3.2** Show investment amount input field (with min/max validation from plan)
- [ ] **3.3** Calculate and display: Daily Return, Weekly Return, Monthly Return based on entered amount
- [ ] **3.4** Pass investment amount + planId to next screen

### Phase 4: DepositRequestScreen Updates
- [ ] **4.1** Pre-fill amount from Terms screen (read-only or editable with validation)
- [ ] **4.2** Add Transaction ID input field (required)
- [ ] **4.3** Show plan summary: Plan name, Amount, Daily Return, Expected ROI
- [ ] **4.4** Submit creates deposit transaction with `planId` reference
- [ ] **4.5** After submit → show pending status, navigate to Dashboard (but with "no active plan" state until approved)

### Phase 5: Backend Changes
- [ ] **5.1** Update `walletController.selectPlan` - Don't activate plan yet, just store `pendingPlanId` on user
- [ ] **5.2** Add `pendingPlanId`, `pendingInvestmentAmount` fields to User model
- [ ] **5.3** Update `walletController.submitDeposit` - Link deposit to `pendingPlanId`, store plan info in transaction
- [ ] **5.4** Admin approve deposit → Activate plan: set `user.activePlan`, `user.activeCategory`, create `UserInvestment` record
- [ ] **5.5** Admin reject deposit → Clear pending plan fields, notify user

### Phase 6: DashboardScreen Updates
- [ ] **6.1** Show "No Active Plan" state if user has no approved plan
- [ ] **6.2** When plan approved → Show active plan card with: Plan name, Investment amount, Daily return, Total ROI earned
- [ ] **6.3** Transaction history tab/filter: Show all deposits/withdrawals with status badges
- [ ] **6.4** Add "Select New Plan" button if user wants to change/add another plan

### Phase 7: Admin Panel Updates
- [ ] **7.1** In Transactions page - Show plan info for deposit transactions
- [ ] **7.2** Add filter for "Pending Plan Activation" deposits
- [ ] **7.3** On approve: Auto-create UserInvestment record, update user balance & activePlan

### Phase 8: Testing & Polish
- [ ] **8.1** Test full flow: Login → Plan Selection → Terms → Deposit → Admin Approve → Dashboard
- [ ] **8.2** Test edge cases: Reject flow, multiple plans, plan switching
- [ ] **8.3** Verify transaction history shows correct statuses
- [ ] **8.4** Add loading states and error handling throughout

---

## Key Files to Modify

### Frontend (Mobile)
| File | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Initial route logic, stack structure |
| `src/context/AuthContext.tsx` | Login redirect, auth state for pending plan |
| `src/screens/PlanSelectionScreen.tsx` | Enhanced plan display, calculator preview |
| `src/screens/TermsConditionScreen.tsx` | Plan details, amount input, ROI calculator |
| `src/screens/DepositRequestScreen.tsx` | Pre-filled amount, transaction ID, plan summary |
| `src/screens/DashboardScreen.tsx` | No-plan state, active plan card, transaction history |
| `src/services/api/walletApi.ts` | New API types for pending plan, deposit with planId |
| `src/types/api.ts` | TypeScript interfaces for new flow |

### Backend
| File | Changes |
|------|---------|
| `models/User.js` | Add `pendingPlanId`, `pendingInvestmentAmount` fields |
| `models/Transaction.js` | Add `planId`, `planName`, `investmentAmount` fields |
| `controllers/walletController.js` | Modify `selectPlan`, `submitDeposit`, add plan activation logic |
| `controllers/adminController.js` | Approve deposit with plan activation |
| `routes/walletRoutes.js` | Ensure endpoints support new fields |

---

## Data Flow Summary

```
User Login
    ↓
PlanSelectionScreen (fetch /wallet/systems)
    ↓ User selects plan
TermsConditionScreen (show plan details + amount input + ROI calc)
    ↓ User agrees + enters amount
DepositRequestScreen (pre-filled amount + transaction ID input)
    ↓ User submits
POST /wallet/deposit { amount, transactionId, planId, investmentAmount }
    ↓ Creates Transaction with status: 'pending', planId ref
Admin Panel: Transactions → See plan info → Approve
    ↓ On Approve:
- User.currentBalance += amount
- User.activePlan = plan.name
- User.activeCategory = plan.category
- User.pendingPlanId = null
- Create UserInvestment record
- Transaction.status = 'approved'
    ↓
User Dashboard → Shows active plan + transaction history
```

---

## Acceptance Criteria

- [ ] User cannot access Dashboard without selecting a plan first
- [ ] Plan selection shows all plans with clear investment/return info
- [ ] Terms screen shows calculated daily/weekly/monthly returns
- [ ] Deposit requires transaction ID and links to selected plan
- [ ] Admin can see plan details when reviewing deposit
- [ ] On admin approval: plan activates, investment record created, balance updated
- [ ] Dashboard shows active plan and transaction history with statuses
- [ ] Rejected deposits clear pending plan state, user can retry

---

## Out of Scope (Future Enhancements)
- Multiple simultaneous plans per user
- Automatic payment verification (webhook integration)
- Plan upgrade/downgrade flow
- Investment maturity/completion handling
- Referral/bonus system
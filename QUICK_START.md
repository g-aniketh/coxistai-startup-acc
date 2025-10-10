# 🚀 CoXist AI - Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Update Backend Environment
Make these changes to `backend/.env`:

```env
# Add these lines (if missing):
FRONTEND_URL=http://localhost:3000
PLAID_ENCRYPTION_KEY=coxist-ai-32-char-encryption-key

# Update this line:
EMAIL_FROM=CoXist AI <noreply@coxistai.com>
```

### 2. Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Should show: "🚀 CoXist AI Startup Accelerator API Server" on port 3001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Should show: "Local: http://localhost:3000"

---

## 🧪 Basic Testing (5 Minutes)

### Step 1: Create Your Account (30 seconds)
```
1. Open: http://localhost:3000/register
2. Fill in:
   - Startup Name: "My Test Startup"
   - First Name: "Test"
   - Last Name: "User"
   - Email: "test@startup.com"
   - Password: "Password123"
   - Confirm: "Password123"
3. Click "Create Account"
```
✅ Should redirect to dashboard showing "Welcome back, Test!"

### Step 2: Create Bank Account (15 seconds)
```
1. Click "Add Account" button (top right)
2. Account Name: "Main Checking"
3. Initial Balance: 50000
4. Click "Create Account"
```
✅ Toast: "Bank account created successfully!"

### Step 3: Add a Product (15 seconds)
```
1. Click "Add Product"
2. Product Name: "Widget A"
3. Initial Stock: 100
4. Price: 99.99
5. Click "Add Product"
```
✅ Dashboard shows: Total Products: 1, Total Value: $9,999

### Step 4: Add Transaction (15 seconds)
```
1. Click "Add Transaction"
2. Account: "Main Checking"
3. Type: "💰 Income (Credit)"
4. Description: "Client Payment"
5. Amount: 5000
6. Click "Add Transaction"
```
✅ Dashboard shows: Total Balance: $55,000

### Step 5: Simulate Sale (15 seconds)
```
1. Click "Simulate Sale"
2. Product: "Widget A"
3. Quantity: 5
4. Account: "Main Checking"
5. Click "Simulate Sale"
```
✅ Stock: 100 → 95, Balance: $55,499.95

### Step 6: Get AI Insights (30 seconds)
```
1. Click "AI Insights" button
2. Click "Generate Insights"
3. Wait 5-10 seconds
```
✅ Shows AI-generated analysis with suggestions

### Step 7: Invite Team Member (30 seconds)
```
1. Navigate to: http://localhost:3000/team
2. Click "Invite Member"
3. Email: "member@startup.com"
4. Role: "Accountant"
5. Click "Send Invitation"
```
✅ Email sent via Resend with credentials

---

## ✅ You're Done!

**All features working:**
- ✅ Authentication
- ✅ Bank accounts
- ✅ Transactions
- ✅ Inventory
- ✅ Sales
- ✅ Dashboard metrics
- ✅ AI insights
- ✅ Team management

**Ready for client demo!** 🎉

---

## 📱 Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api/v1
- **API Docs:** http://localhost:3001/api/v1/docs
- **Health Check:** http://localhost:3001/api/v1/health
- **Database Studio:** `npx prisma studio` (in backend folder)

---

## 🆘 Quick Fixes

**Can't login?**
```bash
# Clear browser data
localStorage.clear()
# Try signup again
```

**Dashboard empty?**
```bash
# Check backend console for errors
# Verify DATABASE_URL is correct
```

**AI not working?**
```bash
# Check OPENAI_API_KEY in backend/.env
# Verify API key has credits
```

---

**For detailed testing:** See `TESTING_GUIDE.md`

**Status:** ✅ READY!


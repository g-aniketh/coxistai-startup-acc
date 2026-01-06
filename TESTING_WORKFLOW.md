# Complete Testing Workflow - Seeded Demo Account

This document provides a step-by-step workflow to test all implemented features using the **pre-seeded demo account** (`demo@coxistai.com`) with comprehensive data already in place.

## Prerequisites

- ✅ Database cleared and schema pushed (`npx prisma db push`)
- ✅ Backend server running
- ✅ Frontend server running
- ✅ **Run seed script** to populate demo data: `cd backend && npm run db:seed`
  - This creates 2 demo accounts with comprehensive seeded data
  - **10 customers** are pre-seeded for each account
  - **All items have stock** (purchase vouchers created for all items)
  - All features have sample data ready for testing

---

## Phase 1: Login to Seeded Demo Account

### Step 1: Login

1. Navigate to `/login`
2. **Login with seeded demo account**:
   - **Email**: `demo@coxistai.com` (recommended for full demo experience)
   - **Password**: `password123`
   - OR use **admin@coxistai.com** with password `password123`
3. Click **Login**
4. **Verify**: You are logged in and redirected to `/dashboard`

---

## Phase 2: What's Already Pre-Seeded

When you login to `demo@coxistai.com`, the following is **already available and ready to use**:

### ✅ Company Configuration
- **Company Profile**: Display Name, Legal Name, Mailing Name, Base Currency (INR)
- **Fiscal Configuration**: Financial Year dates, Books Start Date, Allow Backdated Entries (enabled), Enable Edit Log (disabled)
- **Security Configuration**: Default security settings
- **Currency Configuration**: INR, ₹ symbol, 2 decimal places
- **Feature Toggles**: All features enabled

### ✅ Chart of Accounts & Ledgers
- **All Ledger Groups**: Complete Chart of Accounts structure
- **Essential Ledgers**:
  - Cash Ledger: "Cash" (₹50,000 opening balance)
  - Bank Ledger: "HDFC Bank - Current Account" (₹10,00,000 opening balance)
  - Sales Ledger: "Sales"
  - Purchase Ledger: "Purchases"
  - **10 Customer Ledgers**: Auto-created from customers (in Sundry Debtors)
  - **2 Supplier Ledgers**: "Cloud Services Provider", "Office Supplies Vendor" (in Sundry Creditors)
  - **6 GST Ledgers**: Output/Input CGST, SGST, IGST (in Duties & Taxes)

### ✅ Voucher Types & Numbering
- **All 13 Voucher Types** with default numbering series:
  - Payment (PMT/), Receipt (RCT/), Contra (CTR/), Journal (JRN/)
  - Sales (SAL/), Purchase (PUR/), Debit Note (DN/), Credit Note (CN/)
  - Delivery Note (DN/), Receipt Note (RN/), Stock Journal (SJ/)
  - Memo (MEMO/), Reversing Journal (REV/)

### ✅ Inventory Setup
- **3 Warehouses**:
  - Main Warehouse (WH-001): Bengaluru
  - Secondary Warehouse (WH-002): Mumbai
  - Storage Unit (WH-003): Gurugram
- **5 Items** (all with stock available):
  - Premium SaaS License (ITEM-001): HSN 998314, GST 18%, Sales Rate ₹24,999
  - API Credits - 10K (ITEM-002): HSN 998314, GST 18%, Sales Rate ₹4,199
  - Consulting Hours - 5hr Pack (ITEM-003): HSN 998314, GST 18%, Sales Rate ₹62,500
  - Cloud Server - Monthly (ITEM-004): HSN 998314, GST 18%, Sales Rate ₹15,000, Purchase Rate ₹8,000
  - Office Supplies (ITEM-005): HSN 48201000, GST 12%, Purchase Rate ₹5,000
- **Stock Available**: All items have stock (60-250 units each) from pre-created purchase vouchers

### ✅ GST Configuration
- **1 GST Registration**:
  - GSTIN: "29AABCU9603R1ZX"
  - Registration Type: "Regular"
  - State: "Karnataka", State Code: "29"
  - Legal Name: "Coxist AI Private Limited"
  - Trade Name: "Coxist AI"
- **7 GST Tax Rates** (all standard slabs):
  - GST 0% (Zero-rated)
  - GST 5% (CGST 2.5%, SGST 2.5%)
  - GST 12% (CGST 6%, SGST 6%)
  - GST 18% (CGST 9%, SGST 9%)
  - GST 28% (CGST 14%, SGST 14%)
  - GST 18% - Reverse Charge
  - GST Exempt
- **6 GST Ledger Mappings**:
  - Output CGST → "GST Output CGST"
  - Output SGST → "GST Output SGST"
  - Output IGST → "GST Output IGST"
  - Input CGST → "GST Input CGST"
  - Input SGST → "GST Input SGST"
  - Input IGST → "GST Input IGST"

### ✅ Customers & Suppliers
- **10 Customers** (all with auto-created ledgers):
  - ABC Corporation, XYZ Tech Solutions, Global Enterprises Ltd
  - Innovation Labs Pvt Ltd, Digital Solutions Inc, Cloud Services Co
  - Rajesh Kumar, Priya Sharma, Amit Patel, Sneha Reddy
  - All with GSTIN, addresses, credit limits, and credit periods
- **2 Supplier Ledgers**: Cloud Services Provider, Office Supplies Vendor

### ✅ Cost Management
- **5 Cost Categories**:
  - Sales & Marketing, Operations, Technology, Human Resources, Administration
- **4 Cost Centers**:
  - Sales Department, Marketing Department, Engineering, Customer Support
- **3 Interest Profiles**:
  - Standard Customer Interest (12%), High Risk Customer Interest (18%), Supplier Interest (10%)

### ✅ Pre-Created Vouchers
- **10+ Purchase Vouchers**: Created for all items to ensure stock availability
- **5 Sales Vouchers**: Sample sales transactions
- **3 Payment Vouchers**: Sample payment transactions
- **5 Receipt Vouchers**: Sample receipt transactions
- All vouchers are posted and affect ledger balances and inventory stock

### ✅ Additional Data
- **90 days of Transactions**: Historical transaction data
- **3 Products**: With 20 sales records
- **6 months of Cashflow Metrics**: Historical cashflow data
- **2 AI Scenarios**: Pre-created what-if scenarios
- **2 Alerts**: Pre-created system alerts
- **1 Investor Update**: Sample investor update

---

## Phase 3: Quick Feature Testing (Everything is Ready!)

### Step 2: View Dashboard

1. After login, you're on `/dashboard`
2. **Verify**: Dashboard shows:
   - Cash balance, revenue, expenses
   - Recent transactions
   - Cashflow metrics
   - AI insights

### Step 3: Test Voucher Creation (All Items Have Stock!)

1. Navigate to **Vouchers** → **Sales** (`/vouchers/sales`)
2. **Create a Sales Voucher**:
   - Select any customer from dropdown (10 available)
   - Add any item (all 5 items have stock available)
   - Select warehouse (3 available)
   - Enter quantity (stock is available for all items)
   - GST auto-calculates based on place of supply
   - Click **Save Voucher**
   - Click **Post Voucher**
3. **Verify**: Voucher is created and posted successfully

### Step 4: View Existing Data

1. **View Customers**: Navigate to `/customers` - See 10 pre-created customers
2. **View Items**: Navigate to `/vouchers/items` - See 5 items with stock
3. **View Warehouses**: Navigate to `/vouchers/warehouses` - See 3 warehouses
4. **View Ledgers**: Navigate to `/bookkeeping` → Ledgers tab - See all ledgers
5. **View GST Tax Rates**: Navigate to `/gst` → Tax Rates tab - See 7 tax rates
6. **View Bills**: Navigate to `/bills` - See bills from pre-created vouchers

### Step 5: Test Financial Statements

1. Navigate to **Bookkeeping** (`/bookkeeping`)
2. **Trial Balance**: Click Trial Balance tab → Select date → Refresh
   - **Verify**: Shows all ledger balances from pre-created vouchers
3. **Profit & Loss**: Click Profit & Loss tab → Select date range → Refresh
   - **Verify**: Shows income and expenses from sales/purchase vouchers
4. **Balance Sheet**: Click Balance Sheet tab → Select date → Refresh
   - **Verify**: Shows assets, liabilities, and capital
5. **Cash Flow**: Click Cash Flow tab → Select date range → Refresh
   - **Verify**: Shows cash flows from operations, investing, financing

### Step 6: Test Inventory Stock

1. Navigate to **Vouchers** → **Items** (`/vouchers/items`)
2. **View Stock**: Check stock balance for each item
   - **Verify**: All items show stock (from pre-created purchase vouchers)
3. **Create Sales Voucher**: Use any item - stock should be available
4. **Verify Stock Decrease**: After posting sales voucher, stock decreases

### Step 7: Test GST Features

1. Navigate to **GST** (`/gst`)
2. **View Registrations**: See pre-created GST registration
3. **View Tax Rates**: See 7 pre-created tax rates (0%, 5%, 12%, 18%, 28%, Reverse Charge, Exempt)
4. **View Mappings**: See 6 pre-created ledger mappings
5. **Create Sales Voucher**: GST auto-calculates and posts to GST ledgers

### Step 8: Test Cost Management

1. Navigate to **Cost Management** (`/cost-management`)
2. **View Cost Categories**: See 5 pre-created categories
3. **View Cost Centers**: See 4 pre-created cost centers
4. **View Interest Profiles**: See 3 pre-created interest profiles
5. **Test Cost Centre Reporting**: Generate report with pre-created data

### Step 9: Test Bills Management

1. Navigate to **Bills** (`/bills`)
2. **View Bills**: See bills from pre-created vouchers
3. **View Aging Report**: See bill aging buckets
4. **View Outstanding by Ledger**: See party-wise outstanding
5. **Test Settlement**: Create payment/receipt voucher to settle bills

### Step 10: Test Advanced Features

1. **Audit Log**: Navigate to `/audit-log` - See audit trail of all actions
2. **Role Management**: Navigate to `/role-management` - View roles and permissions
3. **Tally Import/Export**: Navigate to `/tally-import` - Test import/export
4. **AI Assistant**: Navigate to `/ai-assistant` - Test AI features with real data
5. **Year-End Operations**: Navigate to `/bookkeeping` → Year-End tab - Test closing entries

---

## Phase 4: Create New Vouchers (Stock is Available!)

### Step 11: Create Sales Voucher

1. Navigate to `/vouchers/sales`
2. **Fill Details**:
   - Customer: Select any from 10 available customers
   - Date: Today
   - Item: Select any item (all have stock)
   - Quantity: 1-5 units (stock available)
   - Warehouse: Select any warehouse
   - GST: Auto-calculates
3. **Save and Post**: Should work without stock errors!
4. **Verify**: 
   - Voucher posted successfully
   - Stock decreased
   - Ledger balances updated
   - GST posted to GST ledgers

### Step 12: Create Purchase Voucher

1. Navigate to `/vouchers/purchase`
2. **Fill Details**:
   - Supplier: Select supplier ledger
   - Item: Select any item
   - Quantity: 10-20 units
   - Warehouse: Select warehouse
3. **Save and Post**
4. **Verify**: Stock increased

### Step 13: Create Payment/Receipt Vouchers

1. Navigate to `/vouchers/payment` or `/vouchers/receipt`
2. **Fill Details**:
   - Party: Select customer/supplier
   - Amount: Any amount
   - Bank/Cash: Select cash or bank ledger
3. **Add Bill Reference** (optional): Select existing bill
4. **Save and Post**
5. **Verify**: Bill status updated if bill reference provided

---

## Phase 5: Test All Voucher Types

### Step 14: Test All 13 Voucher Types

All voucher types have dedicated forms. Test each:

1. **Payment** (`/vouchers/payment`) - ✅ Tested
2. **Receipt** (`/vouchers/receipt`) - ✅ Tested
3. **Contra** (`/vouchers/contra`) - Transfer between cash/bank
4. **Journal** (`/vouchers/journal`) - Manual entries (must balance)
5. **Sales** (`/vouchers/sales`) - ✅ Tested (stock available)
6. **Purchase** (`/vouchers/purchase`) - ✅ Tested
7. **Credit Note** (`/vouchers/credit-note`) - Sales return
8. **Debit Note** (`/vouchers/debit-note`) - Purchase return
9. **Delivery Note** (`/vouchers/delivery-note`) - Stock decrease
10. **Receipt Note** (`/vouchers/receipt-note`) - Stock increase
11. **Stock Journal** (`/vouchers/stock-journal`) - Stock transfer
12. **Memo** (`/vouchers/memo`) - Memo entries
13. **Reversing Journal** (`/vouchers/reversing-journal`) - Reversing entries

---

## Phase 6: Test Reports & Analytics

### Step 15: Financial Reports

1. **Trial Balance**: `/bookkeeping` → Trial Balance tab
2. **Profit & Loss**: `/bookkeeping` → Profit & Loss tab
3. **Balance Sheet**: `/bookkeeping` → Balance Sheet tab
4. **Cash Flow**: `/bookkeeping` → Cash Flow tab
5. **Financial Ratios**: `/bookkeeping` → Financial Ratios tab

### Step 16: Advanced Books

1. **Cash Book**: `/bookkeeping` → Cash Book tab
2. **Bank Book**: `/bookkeeping` → Bank Book tab
3. **Day Book**: `/bookkeeping` → Day Book tab
4. **Ledger Book**: `/bookkeeping` → Ledger Book tab
5. **Journals**: `/bookkeeping` → Journals tab

### Step 17: Cost Centre Reports

1. Navigate to `/cost-management` → Cost Centre Reporting tab
2. Generate report with pre-created cost centers
3. Verify sales, expenses, and profit per cost centre

---

## Phase 7: Test AI Features

### Step 18: AI Assistant

1. Navigate to `/ai-assistant`
2. **Chatbot Tab**: Ask questions about financial data
3. **Scenarios Tab**: Run what-if scenarios
4. **Insights Tab**: Generate financial insights
5. **Forecasting Tab**: Generate forecasts (3/6/12 months)

---

## Quick Reference: What's Pre-Seeded

### ✅ Fully Configured & Ready to Use

- ✅ 2 Demo Accounts (demo@coxistai.com, admin@coxistai.com)
- ✅ 10 Customers with auto-created ledgers
- ✅ Chart of Accounts (all ledger groups)
- ✅ Essential Ledgers (Cash, Bank, Sales, Purchases, GST, Customer/Supplier)
- ✅ All 13 Voucher Types with numbering series
- ✅ 3 Warehouses
- ✅ 5 Items with HSN/SAC and GST rates
- ✅ **All Items Have Stock** (60-250 units each from purchase vouchers)
- ✅ 1 GST Registration
- ✅ 7 GST Tax Rates (all standard slabs)
- ✅ 6 GST Ledger Mappings
- ✅ 5 Cost Categories
- ✅ 4 Cost Centers
- ✅ 3 Interest Profiles
- ✅ 10+ Purchase Vouchers (posted, stock available)
- ✅ 5 Sales Vouchers (posted)
- ✅ 3 Payment Vouchers (posted)
- ✅ 5 Receipt Vouchers (posted)
- ✅ 90 days of Transactions
- ✅ 6 months of Cashflow Metrics
- ✅ 2 AI Scenarios
- ✅ 2 Alerts
- ✅ 1 Investor Update

### ⚠️ Optional - Can Be Modified/Extended

- Additional Ledgers (can create more)
- Additional Warehouses (can create more)
- Additional Items (can create more)
- Additional GST Tax Rates (can create more)
- Additional Vouchers (can create unlimited)
- Additional Bills (created automatically from vouchers)
- Budgets (can create for variance analysis)

---

## Testing Checklist Summary

✅ **Login & Dashboard**
- [x] Login to demo@coxistai.com
- [x] View dashboard with pre-seeded data

✅ **Voucher Management**
- [x] Create Sales vouchers (all items have stock!)
- [x] Create Purchase vouchers
- [x] Create Payment/Receipt vouchers
- [x] Create all 13 voucher types
- [x] Post and cancel vouchers
- [x] Test bill-wise references

✅ **Inventory Management**
- [x] View items with stock
- [x] Create sales (stock decreases)
- [x] Create purchases (stock increases)
- [x] Test stock movements

✅ **GST Features**
- [x] View GST registrations
- [x] View GST tax rates (7 pre-created)
- [x] View GST ledger mappings
- [x] Test GST calculation in vouchers

✅ **Financial Statements**
- [x] Trial Balance
- [x] Profit & Loss
- [x] Balance Sheet
- [x] Cash Flow
- [x] Financial Ratios

✅ **Advanced Books**
- [x] Cash Book
- [x] Bank Book
- [x] Day Book
- [x] Ledger Book
- [x] Journals

✅ **Cost Management**
- [x] View cost categories
- [x] View cost centers
- [x] View interest profiles
- [x] Cost centre reporting

✅ **Bills Management**
- [x] View bills
- [x] Aging reports
- [x] Outstanding by ledger
- [x] Bill settlement

✅ **Additional Features**
- [x] Audit Log
- [x] Role Management
- [x] Tally Import/Export
- [x] AI Assistant
- [x] Year-End Operations

---

**Happy Testing with Pre-Seeded Data! 🚀**

All features are ready to test immediately - no setup required!

# Complete Testing Workflow - Fresh Account (Sai Vishwas Hospitals)

This document provides a step-by-step workflow to test all implemented features using a **newly registered account** starting from scratch with no pre-seeded data.

## Prerequisites

- ✅ Database cleared and schema pushed (`npx prisma db push`)
- ✅ Backend server running
- ✅ Frontend server running
- ⚠️ **Do NOT run seed script** - This workflow tests a fresh account setup

---

## Phase 1: Account Registration & Initial Setup

### Step 1: Register New Account

1. Navigate to `/register`
2. **Fill Registration Form**:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@saivishwashospitals.com` (or any valid email)
   - Password: `password123`
   - Confirm Password: `password123`
   - Organization Name: `Sai Vishwas Hospitals`
3. Click **Register**
4. **Verify**: You are logged in and redirected to `/dashboard`
5. **Verify**: Empty dashboard with welcome message

---

## Phase 2: Company Configuration

### Step 2: Configure Company Settings

1. Navigate to **Settings** (`/settings`)
2. **General Tab**:
   - Update **Company Profile**: Display Name, Legal Name, Mailing Name
   - Update **Address**: Add hospital address
   - Update **Contact Information**: Phone, Email, Website
   - **Banking Connections**: View mock bank connections (HDFC, ICICI, Axis)
3. **Financial Tab**:
   - Set **Base Currency**: INR (₹)
   - Configure **Fiscal Year**: Start Date (e.g., April 1) and End Date (e.g., March 31)
   - Set **Books Start Date**: Today's date
   - Enable **Allow Backdated Entries**: Toggle ON/OFF
   - Enable **Edit Log**: Toggle ON/OFF
   - Configure **Voucher Numbering**: Choose behavior (Renumber/Retain)
4. **Security Tab**:
   - Review **Vault Encryption** settings
   - Review **Workspace Access Controls**
5. **Billing Tab**:
   - View **Subscription Plans**
   - Review **Feature Toggles**

---

## Phase 3: Chart of Accounts Setup

### Step 3: Create Ledger Groups

1. Navigate to **Bookkeeping** (`/bookkeeping`)
2. **Chart of Accounts Tab** (default):
   - Click **Create Ledger Group**
   - Create essential groups:
     - **Capital Accounts** (Capital)
     - **Fixed Assets** (Assets)
     - **Current Assets** (Assets)
       - Create **Bank Accounts** as sub-group
       - Create **Cash-in-hand** as sub-group
       - Create **Sundry Debtors** as sub-group (for patients)
     - **Current Liabilities** (Liabilities)
       - Create **Sundry Creditors** as sub-group (for suppliers)
     - **Duties & Taxes** (Liabilities)
       - Create **GST** as sub-group
     - **Expenses** (Expenses)
     - **Income** (Income)
3. **Verify**: Groups appear in hierarchical list

### Step 4: Create Essential Ledgers

1. **Ledger Master Tab**:
   - Create **Cash Ledger**:
     - Name: `Cash`
     - Group: `Cash-in-hand`
     - Opening Balance: `50000` (Debit)
   - Create **Bank Ledgers**:
     - `HDFC Bank - Operating Account` (Bank Accounts group, Opening: `1000000`)
     - `ICICI Bank - Trust Account` (Bank Accounts group, Opening: `500000`)
   - Create **Sales Ledger**:
     - Name: `Patient Revenue`
     - Group: `Income`
   - Create **Purchase Ledger**:
     - Name: `Medical Supplies Purchases`
     - Group: `Expenses`
   - Create **GST Ledgers**:
     - `GST Output CGST` (GST group)
     - `GST Output SGST` (GST group)
     - `GST Output IGST` (GST group)
     - `GST Input CGST` (GST group)
     - `GST Input SGST` (GST group)
     - `GST Input IGST` (GST group)
2. **Verify**: All ledgers appear in ledger list

---

## Phase 4: GST Configuration

### Step 5: Setup GST

1. Navigate to **GST** (`/gst`)
2. **Registrations Tab**:
   - Click **Add Registration**
   - Enter:
     - GSTIN: `29AABCU9603R1ZX`
     - Registration Type: `Regular`
     - State: `Karnataka`, State Code: `29`
     - Legal Name: `Sai Vishwas Hospitals Private Limited`
     - Trade Name: `Sai Vishwas Hospitals`
   - Save
3. **Tax Rates Tab**:
   - Create standard GST rates:
     - `0%` (Zero-rated): CGST 0%, SGST 0%
     - `5%`: CGST 2.5%, SGST 2.5%
     - `12%`: CGST 6%, SGST 6%
     - `18%`: CGST 9%, SGST 9%
     - `28%`: CGST 14%, SGST 14%
     - `18% - Reverse Charge`
     - `Exempt`
4. **Mappings Tab**:
   - Map Output CGST → `GST Output CGST`
   - Map Output SGST → `GST Output SGST`
   - Map Output IGST → `GST Output IGST`
   - Map Input CGST → `GST Input CGST`
   - Map Input SGST → `GST Input SGST`
   - Map Input IGST → `GST Input IGST`
5. **Verify**: All GST configurations are saved

---

## Phase 5: Inventory Setup

### Step 6: Create Warehouses

1. Navigate to **Vouchers** → **Warehouses** (`/vouchers/warehouses`)
2. Create warehouses:
   - `Main Ward` (Location: Bengaluru)
   - `ICU Ward` (Location: Bengaluru)
   - `Pharmacy` (Location: Bengaluru)
3. **Verify**: Warehouses appear in list

### Step 7: Create Items

1. Navigate to **Vouchers** → **Items** (`/vouchers/items`)
2. Create items:
   - `Consultation Fee` (Service, HSN 998314, GST 18%, Rate: ₹500)
   - `MRI Scan` (Service, HSN 998314, GST 18%, Rate: ₹5000)
   - `Surgical Kit` (Goods, HSN 90189000, GST 12%, Sales Rate: ₹2000, Purchase Rate: ₹1500)
   - `Medicines Pack A` (Goods, HSN 30049000, GST 12%, Sales Rate: ₹500, Purchase Rate: ₹400)
   - `Lab Test - Blood` (Service, HSN 998314, GST 18%, Rate: ₹300)
3. **Verify**: Items appear with HSN/SAC and GST rates

### Step 8: Create Purchase Vouchers for Stock

1. Navigate to **Vouchers** → **Purchase** (`/vouchers/purchase`)
2. Create purchase vouchers for stock items:
   - **Voucher 1**: Purchase Surgical Kits
     - Supplier: Create supplier ledger if needed
     - Item: Surgical Kit, Quantity: 50, Warehouse: Main Ward
     - GST: 12% (CGST 6%, SGST 6%)
     - Post voucher
   - **Voucher 2**: Purchase Medicines
     - Item: Medicines Pack A, Quantity: 100, Warehouse: Pharmacy
     - GST: 12%
     - Post voucher
3. **Verify**: Stock increases in Items list
4. **Verify**: Ledger balances update (Purchase ledger, GST ledgers, Supplier ledger)

---

## Phase 6: Create Vouchers and Transactions

### Step 9: Create Sales Vouchers

1. Navigate to **Vouchers** → **Sales** (`/vouchers/sales`)
2. Create customer/supplier ledger first if needed:
   - Go to **Customers** (`/customers`) or create via ledger
3. Create sales voucher:
   - **Customer**: Select or create patient ledger
   - **Item**: Consultation Fee, Quantity: 1
   - **Item**: MRI Scan, Quantity: 1
   - **GST**: Auto-calculates based on place of supply
   - **Save** and **Post** voucher
4. **Verify**: 
   - Patient ledger (Sundry Debtors) updated
   - Sales ledger (Patient Revenue) updated
   - GST ledgers updated
   - Bills created automatically

### Step 10: Create Payment Vouchers

1. Navigate to **Vouchers** → **Payment** (`/vouchers/payment`)
2. Create payment voucher:
   - **Party**: Select supplier
   - **Amount**: ₹10000
   - **Bank/Cash**: Select bank or cash ledger
   - **Add Bill Reference**: Select bill to settle (optional)
   - **Save** and **Post**
3. **Verify**: 
   - Supplier ledger balance decreases
   - Bank/Cash ledger balance decreases
   - Bill status updated if bill reference provided

### Step 11: Create Receipt Vouchers

1. Navigate to **Vouchers** → **Receipt** (`/vouchers/receipt`)
2. Create receipt voucher:
   - **Party**: Select patient (customer)
   - **Amount**: ₹5000
   - **Bank/Cash**: Select bank or cash ledger
   - **Add Bill Reference**: Select bill to settle (optional)
   - **Save** and **Post**
3. **Verify**: 
   - Patient ledger balance decreases
   - Bank/Cash ledger balance increases
   - Bill status updated if bill reference provided

### Step 12: Create Other Voucher Types

Test all voucher types:
1. **Contra** (`/vouchers/contra`): Transfer between cash and bank
2. **Journal** (`/vouchers/journal`): Manual entries (must balance)
3. **Credit Note** (`/vouchers/credit-note`): Patient refund/return
4. **Debit Note** (`/vouchers/debit-note`): Supplier return
5. **Delivery Note** (`/vouchers/delivery-note`): Stock decrease
6. **Receipt Note** (`/vouchers/receipt-note`): Stock increase
7. **Stock Journal** (`/vouchers/stock-journal`): Stock transfer between warehouses
8. **Memo** (`/vouchers/memo`): Memo entries (non-accounting)
9. **Reversing Journal** (`/vouchers/reversing-journal`): Reversing entries

---

## Phase 7: Test Financial Features

### Step 13: Test Dashboard

1. Navigate to **Dashboard** (`/dashboard`)
2. **Verify**: 
   - Cash balance displays (from opening balances and transactions)
   - Monthly revenue shows
   - Expenses show
   - Recent transactions appear
   - Bank accounts section shows (mock data from constants)

### Step 14: Test Financial Dashboard

1. Navigate to **Financial Dashboard** (`/financial-dashboard`)
2. **Verify**:
   - Transaction history appears
   - Statistics tab shows summary
   - Charts display data
   - Filters work (date range, type, amount)

### Step 15: Test Revenue Cycle Management

1. Navigate to **RCM Dashboard** (`/rcm`)
2. **Verify**: View RCM dashboard with claims pipeline metrics
3. Navigate to **Patient Billing** (`/invoicing`)
4. **Create Invoice**: Generate patient invoice
5. Navigate to **Insurance Claims** (`/insurance-claims`)
6. **Verify**: View claims management interface
7. Navigate to **Patient Accounts** (`/bills`)
8. **Verify**: View bills, aging analysis, outstanding by ledger

### Step 16: Test Banking & Payments

1. Navigate to **Banking & Payments** (`/banking-payments`)
2. **Verify**: 
   - Hospital bank accounts displayed (HDFC, ICICI, Axis - mock data)
   - Bank connections shown
   - Transaction history visible
   - Invoice generation works

### Step 17: Test Transactions

1. Navigate to **Transactions** (`/transactions`)
2. **Verify**: All created vouchers appear as transactions
3. **Filter**: Test filtering by date, type, amount
4. **Search**: Test search functionality

### Step 18: Test Bookkeeping Reports

1. Navigate to **Bookkeeping** (`/bookkeeping`)
2. **Trial Balance**: 
   - Select date → Refresh
   - **Verify**: Shows all ledger balances
3. **Profit & Loss**:
   - Select date range → Refresh
   - **Verify**: Shows income and expenses
4. **Balance Sheet**:
   - Select date → Refresh
   - **Verify**: Shows assets, liabilities, capital
5. **Cash Flow**:
   - Select date range → Refresh
   - **Verify**: Shows cash flows
6. **Financial Ratios**:
   - Select date → Refresh
   - **Verify**: Shows ratios (may be zero initially)
7. **Cash Book**: Select date range → Refresh
8. **Bank Book**: Select bank and date range → Refresh
9. **Day Book**: Select date → Refresh
10. **Ledger Book**: Select ledger and date range → Refresh
11. **Journals**: Select journal type and date range → Refresh
12. **Budgeting**:
    - Create budget for a ledger
    - View variance analytics
    - Check for breaches
13. **Year-End Operations**:
    - Generate closing entries
    - Run depreciation
    - Carry forward balances

---

## Phase 8: Test Cost Management

### Step 19: Setup Cost Management

1. Navigate to **Cost Management** (`/cost-management`)
2. **Cost Categories Tab**:
   - Create categories: `Payroll`, `Medical Supplies`, `Pharmaceuticals`, `Lab Costs`, `Equipment`
3. **Cost Centers Tab**:
   - Create centers: `Cardiology`, `Orthopedics`, `Emergency`, `Pharmacy`
4. **Interest Profiles Tab**:
   - Create profiles: `Standard Patient Interest 12%`, `Supplier Interest 10%`
5. **Cost Centre Reporting Tab**:
   - Generate report for a cost centre
   - **Verify**: Shows sales, expenses, profit per cost centre

---

## Phase 9: Test Compliance & Admin Features

### Step 20: Test Compliance Hub

1. Navigate to **Compliance Hub** (`/compliance-hub`)
2. **Verify**: View compliance dashboard with GST, tax, and statutory sections
3. Test various compliance reports

### Step 21: Test Audit Log

1. Navigate to **Audit Log** (`/audit-log`)
2. **Verify**: View audit trail of all actions (vouchers created, settings changed, etc.)

### Step 22: Test Smart Alerts

1. Navigate to **Smart Alerts** (`/alerts`)
2. **Verify**: View system alerts and notifications
3. **Create Alert**: Test alert creation (if feature available)

### Step 23: Test Hospital Operations (Dummy Pages)

1. Navigate to **Patients** (`/patients`)
   - **Verify**: View patient management interface (dummy UI)
2. Navigate to **Appointments** (`/appointments`)
   - **Verify**: View appointment scheduling interface (dummy UI)
3. Navigate to **Staff** (`/staff`)
   - **Verify**: View staff directory (dummy UI)
4. Navigate to **Facilities** (`/facilities`)
   - **Verify**: View facility management interface (dummy UI)

### Step 24: Test Admin Features

1. Navigate to **Team Management** (`/team`)
2. **Add Team Member**: 
   - Invite user by email
   - Assign role
3. Navigate to **Role Management** (`/role-management`)
4. **Verify**: View roles and permissions
5. **Assign Roles**: Assign roles to team members
6. Navigate to **Import Data** (`/tally-import`)
7. **Test Import**: Import data from Tally/Excel
8. **Test Export**: Export data to Tally/Excel format

---

## Phase 10: Test AI Features

### Step 25: Test AI Assistant

1. Navigate to **AI Assistant** (`/ai-assistant`)
2. **Chatbot Tab**:
   - Ask questions about financial data
   - Test AI responses
3. **Scenarios Tab**:
   - Create what-if scenarios
   - Run scenarios with different parameters
4. **Insights Tab**:
   - Generate financial insights
   - Review recommendations
5. **Forecasting Tab**:
   - Generate revenue forecasts (3/6/12 months)
   - Generate cashflow forecasts

---

## Quick Reference: Testing Checklist

✅ **Account Setup**
- [ ] Register new account
- [ ] Configure company settings
- [ ] Set up fiscal year and currency

✅ **Chart of Accounts**
- [ ] Create ledger groups (hierarchy)
- [ ] Create essential ledgers with opening balances
- [ ] Create GST ledgers

✅ **GST Configuration**
- [ ] Add GST registration
- [ ] Create GST tax rates (0%, 5%, 12%, 18%, 28%, etc.)
- [ ] Map GST ledgers

✅ **Inventory Setup**
- [ ] Create warehouses
- [ ] Create items (services and goods) with HSN/SAC
- [ ] Create purchase vouchers to add stock
- [ ] Verify stock availability

✅ **Voucher Creation**
- [ ] Create Sales vouchers
- [ ] Create Purchase vouchers
- [ ] Create Payment vouchers
- [ ] Create Receipt vouchers
- [ ] Create all 13 voucher types
- [ ] Post and cancel vouchers
- [ ] Test bill-wise references

✅ **Revenue Cycle Management**
- [ ] View RCM Dashboard
- [ ] Create patient invoices
- [ ] Manage insurance claims
- [ ] View patient accounts and aging

✅ **Banking & Payments**
- [ ] View bank accounts (mock data)
- [ ] View bank connections
- [ ] Generate invoices
- [ ] View transaction history

✅ **Transactions**
- [ ] View all transactions
- [ ] Filter transactions
- [ ] Search transactions

✅ **Bookkeeping**
- [ ] Chart of Accounts management
- [ ] Ledger Master management
- [ ] Trial Balance
- [ ] Profit & Loss
- [ ] Balance Sheet
- [ ] Cash Flow
- [ ] Financial Ratios
- [ ] Cash Book
- [ ] Bank Book
- [ ] Day Book
- [ ] Ledger Book
- [ ] Journals
- [ ] Budgeting (create budget, view variance, check breaches)
- [ ] Year-End Operations (closing entries, depreciation, carry forward)

✅ **Cost Management**
- [ ] Create cost categories
- [ ] Create cost centers
- [ ] Create interest profiles
- [ ] Generate cost centre reports

✅ **Compliance & Reports**
- [ ] Compliance Hub
- [ ] Audit Log
- [ ] Smart Alerts

✅ **Hospital Operations (Dummy)**
- [ ] Patients page (UI only)
- [ ] Appointments page (UI only)
- [ ] Staff page (UI only)
- [ ] Facilities page (UI only)

✅ **Admin Features**
- [ ] Team Management (add/remove users)
- [ ] Role Management (assign roles)
- [ ] Tally Import/Export
- [ ] Settings (all tabs)

✅ **AI Features**
- [ ] AI Assistant (Chatbot, Scenarios, Insights, Forecasting)

---

## Expected Results

### ✅ Successful Setup Indicators

- Company profile configured
- Chart of Accounts structure created
- Essential ledgers with opening balances
- GST fully configured
- Items created with stock
- Multiple vouchers created and posted
- Financial statements generate correctly
- Dashboard shows real data
- All reports work with created data

### ⚠️ Common Issues & Solutions

- **No data in reports**: Create vouchers first, then generate reports
- **Stock errors**: Create purchase vouchers to add stock before sales
- **Empty dashboard**: Create transactions first
- **GST not calculating**: Ensure GST configuration is complete (registration, rates, mappings)

---

**Happy Testing with Fresh Account Setup! 🚀**

This workflow ensures all features work correctly from a fresh start, validating the complete setup process.

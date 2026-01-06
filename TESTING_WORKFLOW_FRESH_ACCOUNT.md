# Complete Testing Workflow - Fresh Account (From Scratch)

This document provides a step-by-step workflow to test all implemented features starting from a **fresh account signup** with no pre-seeded data.

## Prerequisites

- ✅ Database cleared and schema pushed (`npx prisma db push`)
- ✅ Backend server running
- ✅ Frontend server running
- ⚠️ **DO NOT run seed script** - We're testing from scratch!

---

## Phase 1: Account Signup & Initial Setup

### Step 1: Sign Up New Account

1. Navigate to `/signup` or `/register`
2. **Fill signup form**:
   - Email: `test@example.com` (or any email)
   - Password: `password123` (or your preferred password)
   - Company Name: "Test Company Pvt Ltd"
   - Full Name: "Test User"
   - Phone: "+91-98765-43210" (optional)
3. Click **Sign Up** or **Create Account**
4. **Verify**: You are logged in and redirected to `/dashboard`

**Note**: After signup, the system automatically creates:
- ✅ Company Profile (basic details)
- ✅ Fiscal Configuration (default dates)
- ✅ Security Configuration (default settings)
- ✅ Currency Configuration (INR, ₹, 2 decimals)
- ✅ Feature Toggles (all enabled)
- ✅ Chart of Accounts (all ledger groups)
- ✅ Default Ledgers (Cash, Sales, Purchases)
- ✅ All 13 Voucher Types (with default numbering series)

---

## Phase 2: Company Configuration

### Step 2: Company Profile Setup

1. Navigate to **Settings** (`/settings`)
2. Select the **General** tab and expand the **Company Profile** card
3. **Update profile**:
   - Display Name: "Test Company"
   - Legal Name: "Test Company Private Limited"
   - Mailing Name: "Test Co"
   - Add addresses:
     - Click "Add Address"
     - Address Line 1: "123 Test Street"
     - City: "Bengaluru"
     - State: "Karnataka"
     - PIN: "560001"
     - Country: "India"
     - Mark as Primary, Billing, Shipping
     - Add 2-3 addresses (Registered, Mailing, Branch)
   - Save changes
4. **Verify**: All addresses are saved and displayed

### Step 3: Fiscal Configuration

1. Stay in **Settings** → **Financial** tab
2. Open **Financial Year & Edit Log** card
3. **Configure**:
   - Financial Year Start: `2024-04-01` (or your preferred date)
   - Financial Year End: `2025-03-31` (or your preferred date)
   - Books Start Date: `2024-04-01` (or your preferred date)
   - Allow Backdated Entries: `Yes` (toggle ON) - **Important for testing backdated vouchers**
   - Enable Edit Log: `Yes` (toggle ON) - **Important for audit trail testing**
4. Save changes
5. **Verify**: Settings are saved and displayed correctly

### Step 4: Security Settings

1. Switch to the **Security** tab in Settings
2. **Configure** (optional):
   - Enable **Vault Encryption** for company data (toggle ON and set a vault password if enabling)
   - Enable **User Access Controls** (toggle ON)
   - Enable **Multi-factor Authentication** for privileged roles (optional)
3. Save changes if modified

### Step 5: Currency Configuration

1. In **Settings** → **Financial** tab, open **Base Currency & Formatting** card
2. **Verify or update**:
   - Base Currency Code: `INR`
   - Currency Symbol: `₹`
   - Decimal Places: `2`
   - Show Amount in Millions: `No`
3. Save changes if modified

### Step 6: Feature Toggles

1. Switch to the **Billing & Subscription** tab → **Feature Access** section
2. **Verify all modules** in **Feature Access**:
   - ✅ Accounting & Ledgers
   - ✅ Inventory & Stock
   - ✅ Tax & Compliance
   - ✅ Payroll & HR (may be disabled for starter plans)
   - ✅ AI Insights
   - ✅ Scenario Planning
   - ✅ Automations (may be disabled for starter plans)
   - ✅ Vendor Management (may be disabled for starter plans)
   - ✅ Billing & Invoicing
3. Enable any disabled features if needed
4. Save changes if modified

---

## Phase 3: Chart of Accounts & Ledger Setup

### Step 7: View Ledger Groups (Chart of Accounts)

1. Navigate to **Bookkeeping** (`/bookkeeping`)
2. The **Chart of Accounts** tab should be active by default
3. **Note**: Ledger groups are auto-created on signup
4. **View existing groups** in the Chart of Accounts tree:
   - You should see all standard groups:
     - Capital Accounts, Loans, Current Liabilities, Bank Accounts, Cash-in-hand
     - Current Assets, Purchase Accounts, Sales Accounts
     - Direct/Indirect Expenses and Incomes
   - Sub-groups under Current Liabilities: Sundry Creditors, Duties & Taxes
   - Sub-groups under Current Assets: Sundry Debtors, Stock-in-hand
5. **Optional**: Create additional groups if needed using the form
6. **Verify**:
   - All groups appear in the Chart of Accounts tree
   - Hierarchy renders correctly (child groups indented)

### Step 8: Create Essential Ledgers

1. Stay in **Bookkeeping** → **Ledgers** tab (click on "Ledger Master" tab)
2. **View existing ledgers**: You should see default ledgers (Cash, Sales, Purchases)
3. **Create additional essential ledgers**:

   **Bank Ledger**:
   - Group: "Bank Accounts"
   - Name: "HDFC Bank - Current Account"
   - Ledger Subtype: "BANK"
   - Opening Balance: 10,00,000
   - Opening Balance Type: "DEBIT"
   - Click **Create Ledger**

   **Customer Ledgers** (will be auto-created when you create customers, but you can create manually):
   - Group: "Sundry Debtors"
   - Name: "ABC Corporation"
   - Ledger Subtype: "CUSTOMER"
   - Maintain Bill by Bill: Yes
   - Credit Limit: 5,00,000
   - Click **Create Ledger**

   **Supplier Ledgers**:
   - Group: "Sundry Creditors"
   - Name: "Cloud Services Provider"
   - Ledger Subtype: "SUPPLIER"
   - Maintain Bill by Bill: Yes
   - Click **Create Ledger**

   **GST Ledgers**:
   - Group: "Duties & Taxes"
   - Create 6 GST ledgers:
     - "GST Output CGST" (Subtype: TAX_GST_OUTPUT, Opening Balance Type: CREDIT)
     - "GST Output SGST" (Subtype: TAX_GST_OUTPUT, Opening Balance Type: CREDIT)
     - "GST Output IGST" (Subtype: TAX_GST_OUTPUT, Opening Balance Type: CREDIT)
     - "GST Input CGST" (Subtype: TAX_GST_INPUT, Opening Balance Type: DEBIT)
     - "GST Input SGST" (Subtype: TAX_GST_INPUT, Opening Balance Type: DEBIT)
     - "GST Input IGST" (Subtype: TAX_GST_INPUT, Opening Balance Type: DEBIT)

4. **Verify**: All ledgers appear in the **Ledger Register** table

---

## Phase 4: Voucher Types & Numbering Setup

### Step 9: View and Configure Voucher Types

1. Navigate to **Settings** (`/settings`)
2. Go to the **Financial** tab
3. Scroll down to the **Voucher Types & Numbering** section
4. **View existing types**: You should see **all 13 voucher types** auto-created on signup:
   - Payment, Receipt, Contra, Journal, Sales, Purchase, Debit Note, Credit Note
   - Delivery Note, Receipt Note, Stock Journal, Memo, Reversing Journal
5. **Optional**: Create additional voucher types if needed using **Add Voucher Type** button
6. **Verify**: All voucher types appear as cards with their configurations

### Step 10: Configure Numbering Series

1. Stay in **Settings** → **Financial** tab → **Voucher Types & Numbering** section
2. **View existing series**: Each voucher type should have a "Default" numbering series
3. **Edit voucher type settings** (optional):
   - Click on a voucher type card
   - Update prefix, suffix, next number, and checkboxes as needed
4. **Add additional numbering series** (optional):
   - Scroll to the "Numbering Series" section within a voucher type card
   - Enter Series Name (e.g., "HO-2025")
   - Enter Prefix (optional)
   - Enter Suffix (optional)
   - Click **Add Series** button
5. **Verify**: All series appear under each voucher type card with their details

---

## Phase 5: Inventory & Items Setup

### Step 11: Create Warehouses

1. Navigate to **Vouchers** → **Warehouses** (`/vouchers/warehouses`)
2. **Create warehouses**:
   - Click **Add Warehouse** button
   - Name: "Main Warehouse"
   - Alias: "WH-001"
   - Address: "91 Springboard, Residency Road, Bengaluru"
   - Is Active: Yes
   - Click **Create**
   - Repeat for 2-3 more warehouses:
     - "Secondary Warehouse" (WH-002), Mumbai address
     - "Storage Unit" (WH-003), Gurugram address
3. **Verify**: All warehouses appear in the warehouses list

### Step 12: Create Items

1. Navigate to **Vouchers** → **Items** (`/vouchers/items`)
2. **Create items**:
   - Click **Add Item** button
   - Item Name: "Premium SaaS License"
   - Alias: "ITEM-001"
   - HSN / SAC: "998314" (Software services)
   - Unit: "License"
   - Default Sales Rate: 24,999
   - Default Purchase Rate: 0 (if not purchased)
   - GST Rate (%): 18
   - Is Active: Yes
   - Click **Create**
   - Repeat for more items:
     - "API Credits - 10K" (ITEM-002, HSN 998314, GST 18%, Rate ₹4,199)
     - "Consulting Hours - 5hr Pack" (ITEM-003, HSN 998314, GST 18%, Rate ₹62,500)
     - "Cloud Server - Monthly" (ITEM-004, HSN 998314, GST 18%, Sales ₹15,000, Purchase ₹8,000)
     - "Office Supplies" (ITEM-005, HSN 48201000, GST 12%, Purchase ₹5,000)
3. **Verify**: All items appear in the items list with their HSN/SAC, GST rates, and default rates

**Important**: Items start with 0 stock. You need to create Purchase vouchers first to add stock before creating Sales vouchers.

---

## Phase 6: GST/Statutory Configuration

### Step 13: Create GST Registration

1. Navigate to **GST** (`/gst`)
2. **GST Registrations Tab** should be active by default
3. **Create GST registration**:
   - Click **Add Registration** button
   - GSTIN: "29AABCU9603R1ZX" (or generate a valid format)
   - Registration Type: "Regular"
   - State Code: "29" (Karnataka)
   - State Name: "Karnataka"
   - Legal Name: "Test Company Private Limited"
   - Trade Name: "Test Company"
   - Start Date: Today's date
   - Is Default: Yes
   - Is Active: Yes
   - Click **Create**
4. **Verify**: GST registration appears in the registrations list

### Step 14: Create GST Tax Rates

1. Stay in **GST** → **Tax Rates** tab (click on "Tax Rates" tab)
2. **Create tax rates** for all standard GST slabs:

   **GST 0% Rate**:
   - Registration: Select your GST registration (or leave as "Use default registration")
   - Tax Name: "GST 0%"
   - Supply Type: "Goods"
   - HSN / SAC: "General"
   - Total GST (%): 0
   - Tax Type: "ZERO_RATED"
   - Applicable On: "Both"
   - Reverse Charge: No
   - Is Active: Yes
   - Click **Create**

   **GST 5% Rate**:
   - Tax Name: "GST 5%"
   - Total GST (%): 5
   - Tax Type: "REGULAR"
   - (System auto-splits to CGST 2.5%, SGST 2.5%)
   - Click **Create**

   **GST 12% Rate**:
   - Tax Name: "GST 12%"
   - Total GST (%): 12
   - (System auto-splits to CGST 6%, SGST 6%)
   - Click **Create**

   **GST 18% Rate**:
   - Tax Name: "GST 18%"
   - Total GST (%): 18
   - (System auto-splits to CGST 9%, SGST 9%)
   - Click **Create**

   **GST 28% Rate**:
   - Tax Name: "GST 28%"
   - Total GST (%): 28
   - (System auto-splits to CGST 14%, SGST 14%)
   - Click **Create**

   **GST 18% - Reverse Charge**:
   - Tax Name: "GST 18% - Reverse Charge"
   - Total GST (%): 18
   - Applicable On: "Purchase"
   - Reverse Charge: Yes
   - Click **Create**

   **GST Exempt**:
   - Tax Name: "GST Exempt"
   - Total GST (%): 0
   - Tax Type: "EXEMPT"
   - Click **Create**

3. **Verify**: All tax rates appear in the Tax Rates table with correct percentages

### Step 15: Create GST Ledger Mappings

1. Stay in **GST** → **Mappings** tab (click on "Mappings" tab)
2. **Create ledger mappings**:
   - Click **Create Ledger Mapping** button
   - Registration: Select your GST registration
   - Mapping Type: "Output CGST"
   - Ledger Name: "GST Output CGST" (select from dropdown)
   - Click **Create**
   - Repeat for all 6 mappings:
     - Output CGST → "GST Output CGST"
     - Output SGST → "GST Output SGST"
     - Output IGST → "GST Output IGST"
     - Input CGST → "GST Input CGST"
     - Input SGST → "GST Input SGST"
     - Input IGST → "GST Input IGST"
3. **Verify**: All mappings appear in the Ledger Mappings table

---

## Phase 7: Customer & Supplier Management

### Step 16: Create Customers

1. Navigate to **Customers** (`/customers`)
2. **Create customers**:
   - Click **Add Customer** button
   - Customer Name: "ABC Corporation"
   - Customer Type: "Business"
   - Phone: "+91-80-1234-5678"
   - Email: "contact@abccorp.com"
   - Billing Address:
     - Address Line 1: "123 Business Park"
     - City: "Bengaluru"
     - State: "Karnataka"
     - Country: "India"
     - PIN: "560001"
   - GST Applicable: Yes
   - GSTIN: "29AABCU1234A1Z5"
   - Place of Supply State: "29"
   - Credit Limit: 5,00,000
   - Credit Period (Days): 30
   - Click **Create**
   - Repeat for 5-10 more customers:
     - XYZ Tech Solutions, Global Enterprises Ltd, Innovation Labs Pvt Ltd
     - Digital Solutions Inc, Cloud Services Co
     - Rajesh Kumar (Individual), Priya Sharma (Individual), etc.
3. **Verify**: 
   - All customers appear in the customers list
   - Customer ledgers are auto-created in Sundry Debtors group
   - Ledgers appear in Bookkeeping → Ledgers tab

---

## Phase 8: Create Purchase Vouchers (Add Stock First!)

### Step 17: Create Purchase Vouchers to Add Stock

**IMPORTANT**: Before creating Sales vouchers, you must create Purchase vouchers to add stock to items.

1. Navigate to **Vouchers** → **Purchase** (`/vouchers/purchase`)
2. **Create purchase vouchers for each item**:

   **Purchase Voucher 1** (for Premium SaaS License):
   - Date: 90 days ago (to ensure stock exists before sales)
   - Supplier Ledger: Select "Cloud Services Provider" (or create supplier first)
   - Narration: "Purchase from Cloud Services Provider"
   - Add Inventory Line:
     - Item: "Premium SaaS License"
     - Warehouse: "Main Warehouse"
     - Quantity: 50 (create sufficient stock)
     - Rate: 20,000
     - GST Rate: 18%
   - Click **Save Voucher**
   - Click **Post Voucher** (important - only posted vouchers add stock!)

   **Purchase Voucher 2** (for API Credits):
   - Item: "API Credits - 10K"
   - Quantity: 100
   - Rate: 3,500
   - GST Rate: 18%
   - Post the voucher

   **Purchase Voucher 3** (for Consulting Hours):
   - Item: "Consulting Hours - 5hr Pack"
   - Quantity: 20
   - Rate: 50,000
   - GST Rate: 18%
   - Post the voucher

   **Purchase Voucher 4** (for Cloud Server):
   - Item: "Cloud Server - Monthly"
   - Quantity: 30
   - Rate: 8,000
   - GST Rate: 18%
   - Post the voucher

   **Purchase Voucher 5** (for Office Supplies):
   - Item: "Office Supplies"
   - Quantity: 50
   - Rate: 5,000
   - GST Rate: 12%
   - Post the voucher

3. **Verify Stock**:
   - Navigate to **Vouchers** → **Items** (`/vouchers/items`)
   - Check stock balance for each item
   - **Verify**: All items now show stock in warehouses

---

## Phase 9: Voucher Entry & Bill-wise Tracking

### Step 18: Create Sales Voucher with Inventory and GST

1. Navigate to **Vouchers** → **Sales** (`/vouchers/sales`)
2. Fill voucher details:
   - Date: Today's date
   - Voucher Number: (Auto-generated from series)
   - Narration: "Sale to Customer ABC"
   - **Customer**: Select from dropdown (customers you created)
     - When you select a customer, billing details auto-fill:
       - Billing Name: Auto-filled from customer
       - Billing Address: Auto-filled from customer address
       - Customer GSTIN: Auto-filled if customer has GST
       - Place of Supply State: Auto-filled from customer
   - Customer Ledger: Auto-selected based on customer
3. Add inventory lines:
   - Click "Add Item" or similar button
   - Item: Select "Premium SaaS License" (or another item with stock)
   - Quantity: 2 (ensure stock is available)
   - Rate: 24,999 (default from item, can override)
   - Warehouse: Select "Main Warehouse"
   - Discount: (optional)
   - GST Rate: 18% (auto-filled from item, can override)
   - Line Amount: Auto-calculated (Quantity × Rate - Discount)
4. **Verify totals**:
   - Items Subtotal: Sum of all line amounts
   - Total Tax Amount: Calculated based on GST rates and place of supply
   - Total Invoice Amount: Items Subtotal + Total Tax
5. Add bill reference (optional):
   - Bill Type: "Receivable"
   - Bill Number: "BILL-001" (or auto-generated)
   - Bill Date: Today
   - Due Date: 30 days from today
   - Amount: Total Invoice Amount
6. Click **Save Voucher** or **Create Voucher**
7. **Verify**:
   - Voucher is created with status "DRAFT"
   - Inventory lines are saved
   - GST amounts are calculated correctly (CGST/SGST for same state, IGST for different state)
   - Bill is created automatically if bill reference provided
   - Click "Post Voucher" to post it (changes status to "POSTED" and triggers posting engine)
   - **Verify stock decreased** after posting

### Step 19: Create Payment Voucher (Bill Settlement)

1. Navigate to **Vouchers** → **Payment** (`/vouchers/payment`)
2. Fill voucher details:
   - Date: Today
   - Narration: "Payment to Supplier XYZ"
   - Paid From Ledger: Select "HDFC Bank - Current Account" or "Cash" (must be CASH/BANK subtype)
   - Paid To Ledger: Select "Cloud Services Provider" (must NOT be CASH/BANK)
   - Amount: 3,000
   - Payment Mode: Select from dropdown (Cash, Bank Transfer, Cheque, UPI, NEFT)
   - Reference Number: (optional)
3. Add bill reference for settlement:
   - **Bill Reference**: Select existing bill (if created in previous step)
   - Reference Type: "AGAINST" (to settle against existing bill)
   - Settlement Amount: 3,000
4. Click **Save Voucher**
5. **Verify**:
   - Voucher is created with status "DRAFT"
   - Click "Post Voucher" to post it
   - Check that bill status changed to "Partial" or "Settled" (if bill reference was provided)

### Step 20: Create Receipt Voucher (Bill Settlement)

1. Navigate to **Vouchers** → **Receipt** (`/vouchers/receipt`)
2. Fill voucher details:
   - Date: Today
   - Narration: "Receipt from Customer ABC"
   - Received Into Ledger: Select "HDFC Bank - Current Account" or "Cash" (must be CASH/BANK subtype)
   - Received From Ledger: Select "ABC Corporation" (must NOT be CASH/BANK)
   - Amount: 5,000
   - Payment Mode: Select from dropdown
   - Reference Number: (optional)
3. Add bill reference for settlement:
   - **Bill Reference**: Select existing bill (if created in previous step)
   - Reference Type: "AGAINST" (to settle against existing bill)
   - Settlement Amount: 5,000
4. Click **Save Voucher**
5. **Verify**:
   - Voucher is created with status "DRAFT"
   - Click "Post Voucher" to post it
   - Check that bill status changed to "Partial" or "Settled" (if bill reference was provided)

### Step 21: Create Other Voucher Types

1. **Create Contra Voucher**:
   - Navigate to `/vouchers/contra`
   - Source Ledger: "Cash" (CASH/BANK)
   - Destination Ledger: "HDFC Bank - Current Account" (CASH/BANK)
   - Amount: 10,000
   - Click **Save Voucher** (creates as DRAFT)
   - Click "Post Voucher" to post it

2. **Create Journal Voucher**:
   - Navigate to `/vouchers/journal`
   - Add multiple entries with DR/CR amounts
   - Ensure total DR = total CR (validation enforced)
   - Click **Save Voucher** (creates as DRAFT)
   - Click "Post Voucher" to post it

3. **Create Credit Note, Debit Note, Delivery Note, Receipt Note, Stock Journal, Memo, Reversing Journal**:
   - Navigate to their respective dedicated forms
   - Fill entries as per the voucher type rules
   - Click **Save Voucher** (creates as DRAFT)
   - Click "Post Voucher" to post it

### Step 22: Test Voucher Posting Engine

1. **Create a Draft Voucher**:
   - Create any voucher (e.g., Payment, Sales, Purchase)
   - Save it without posting (status should be "DRAFT")

2. **Verify Draft State**:
   - Check that the voucher appears in the list with status "DRAFT"
   - Verify that ledger balances are NOT affected (draft vouchers don't update balances)
   - Verify that inventory stock is NOT affected (draft vouchers don't update stock)

3. **Post the Voucher**:
   - Click "Post Voucher" button on the draft voucher
   - **Verify Posting**:
     - Voucher status changes to "POSTED"
     - Ledger balances are updated correctly
     - Inventory stock is updated (for Sales/Purchase/Delivery Note/Receipt Note/Stock Journal)
     - GST amounts are posted to GST ledgers (for Sales/Purchase)
     - Bill references are processed (if applicable)

4. **Test Voucher Cancellation**:
   - Find a posted voucher
   - Click "Cancel Voucher" button
   - **Verify Cancellation**:
     - Voucher status changes to "CANCELLED"
     - Ledger balances are reversed
     - Inventory stock is reversed (if applicable)
     - GST amounts are reversed (if applicable)

5. **Test Validation**:
   - Try to create an unbalanced voucher (DR ≠ CR) → Should fail validation
   - Try to create a Sales voucher with insufficient stock → Should fail validation
   - Try to create a Receipt voucher exceeding credit limit → Should fail validation

---

## Phase 10: Inventory Management Testing

### Step 23: Test Inventory Stock Movements

1. **View Current Stock**:
   - Navigate to **Vouchers** → **Items** (`/vouchers/items`)
   - View stock balance for each item across all warehouses
   - **Verify**: Stock is available from purchase vouchers created earlier

2. **Test Stock Decrease (Sales/Delivery Note)**:
   - Create a **Sales Voucher** with inventory lines:
     - Item: "Cloud Server - Monthly"
     - Quantity: 3
     - Warehouse: "Main Warehouse"
   - Post the voucher
   - **Verify**: Stock for "Cloud Server - Monthly" in "Main Warehouse" decreases by 3

3. **Test Stock Movement (Stock Journal)**:
   - Create a **Stock Journal** voucher (`/vouchers/stock-journal`):
     - Source Warehouse: "Main Warehouse"
     - Destination Warehouse: "Secondary Warehouse"
     - Item: "Cloud Server - Monthly"
     - Quantity: 2
   - Post the voucher
   - **Verify**: 
     - Stock in "Main Warehouse" decreases by 2
     - Stock in "Secondary Warehouse" increases by 2

4. **Test Stock Validation**:
   - Try to create a Sales voucher with quantity exceeding available stock → Should fail validation
   - Verify error message indicates insufficient stock

5. **Test Delivery Note and Receipt Note**:
   - **Delivery Note** (`/vouchers/delivery-note`): Creates inventory decrease without ledger entries
   - **Receipt Note** (`/vouchers/receipt-note`): Creates inventory increase without ledger entries
   - Create and post these vouchers to verify stock movements

---

## Phase 11: Bills Management

### Step 24: View Bills

1. Navigate to **Bills** (`/bills`)
2. View all bills:
   - Filter by Bill Type: Receivables / Payables
   - Filter by Status: Open / Partial / Settled
3. Verify bills created from vouchers are listed

### Step 25: Bill Aging Report

1. Stay in **Bills** page
2. Navigate to **Aging Report** section
3. View aging buckets:
   - Current (not overdue)
   - 1-30 days
   - 31-60 days
   - 61-90 days
   - Over 90 days
4. Verify bills are categorized correctly

### Step 26: Outstanding by Ledger

1. Stay in **Bills** page
2. Navigate to **Outstanding by Ledger** section
3. View party-wise outstanding:
   - Customer ABC: Outstanding amount
   - Supplier XYZ: Outstanding amount
4. Verify calculations are correct

### Step 27: Manual Bill Settlement

1. In **Bills** page, find an open bill
2. Click **Settle Bill**
3. Select voucher and entry for settlement
4. Enter settlement amount
5. Add remarks
6. Complete settlement
7. **Verify**: Bill status updated, outstanding reduced

---

## Phase 12: Cost Management Setup

### Step 28: Cost Categories

1. Navigate to **Cost Management** (`/cost-management`)
2. **Cost Categories Tab** should be active by default
3. Create root categories:
   - "Revenue" (mark as Primary)
   - "Expenses"
   - "Assets"
4. Create sub-categories:
   - Under "Revenue": "Sales", "Services"
   - Under "Expenses": "Operations", "Marketing", "HR"
   - Under "Assets": "Fixed Assets", "Current Assets"
5. Verify hierarchical structure displays correctly

### Step 29: Cost Centers

1. Stay in **Cost Management** → **Cost Centers Tab** (click on "Centers" tab)
2. Create cost centers:
   - Category: "Expenses" → "Operations"
     - Name: "Office Rent", Code: "OFF-RENT"
     - Name: "Utilities", Code: "UTIL"
   - Category: "Expenses" → "Marketing"
     - Name: "Digital Ads", Code: "DIG-ADS"
     - Name: "Events", Code: "EVENTS"
3. Create hierarchical cost centers:
   - Parent: "Digital Ads"
     - Child: "Google Ads", Code: "GOOG-ADS"
     - Child: "Facebook Ads", Code: "FB-ADS"

### Step 30: Interest Profiles

1. Stay in **Cost Management** → **Interest** tab (click on "Interest" tab)
2. Create interest profiles:
   - Name: "Standard Receivables"
     - Calculation Mode: "Simple"
     - Rate: 12%
     - Grace Period: 30 days
     - Calculate from Due Date: Yes
   - Name: "Penalty Interest"
     - Calculation Mode: "Simple"
     - Rate: 18%
     - Penal Rate: 24%
     - Penal Grace Days: 0
3. Save all profiles

### Step 31: Assign Interest to Parties

1. Stay in **Cost Management** → **Party Interest** tab (click on "Party Interest" tab)
2. Click **Add Party** and create a record:
   - Name, type (Customer/Supplier/Employee/Other), optional email/phone
   - Opening balance & balance type are optional but useful for context
3. After saving, click **Assign Interest**
   - **Interest Profile:** pick the profile you created earlier (e.g., "Standard Receivables")
   - **Party:** choose the party from the dropdown
   - Configure optional override rate, effective dates, and whether it applies to Receivables and/or Payables
4. Click **Assign**
5. **Verify:** The new row appears in the Party Interest table with the correct party, profile, and badges

---

## Phase 13: Financial Statements & Reports

### Step 32: Trial Balance

1. Navigate to **Bookkeeping** (`/bookkeeping`)
2. Click on the **Trial Balance** tab
3. **View Trial Balance**:
   - Select a date using the date picker (defaults to today)
   - Click **Refresh** to generate the report
   - Review all ledger balances with debit and credit columns
   - Verify the total debit equals total credit
4. **Verify**: All ledgers with balances are listed, and totals match

### Step 33: Profit & Loss Statement

1. Stay in **Bookkeeping** → **Profit & Loss** tab
2. **Generate P&L**:
   - Select date range (From Date and To Date)
   - Defaults to current financial year
   - Click **Refresh** to generate
3. **Review Report**:
   - **Trading Account**: View direct incomes and direct expenses
   - **Gross Profit**: Verify calculation (Total Incomes - Total Expenses)
   - **Profit & Loss Account**: View indirect incomes and indirect expenses
   - **Net Profit/Loss**: Verify calculation
4. **Verify**: All income and expense ledgers are categorized correctly

### Step 34: Balance Sheet

1. Stay in **Bookkeeping** → **Balance Sheet** tab
2. **Generate Balance Sheet**:
   - Select a date using the date picker (defaults to today)
   - Click **Refresh** to generate
3. **Review Report**:
   - **Liabilities & Capital**: View all liabilities and capital accounts
   - **Assets**: View all asset accounts
   - Verify totals match (Assets = Liabilities + Capital)
4. **Verify**: All asset, liability, and capital ledgers are properly categorized

### Step 35: Cash Flow Statement

1. Stay in **Bookkeeping** → **Cash Flow** tab
2. **Generate Cash Flow**:
   - Select date range (From Date and To Date)
   - Click **Refresh** to generate
3. **Review Report**:
   - **Opening Balance**: Starting cash balance
   - **Operating Activities**: Cash flows from operations
   - **Investing Activities**: Cash flows from investments
   - **Financing Activities**: Cash flows from financing
   - **Net Cash Flow**: Total cash flow for the period
   - **Closing Balance**: Ending cash balance
4. **Verify**: Cash flows are properly categorized and closing balance = opening + net cash flow

### Step 36: Financial Ratios

1. Stay in **Bookkeeping** → **Financial Ratios** tab
2. **View Ratios**:
   - Select a date using the date picker (defaults to today)
   - Click **Refresh** to generate
3. **Review Ratios**:
   - **Liquidity Ratios**: Current Ratio, Quick Ratio
   - **Profitability Ratios**: Gross Profit Margin, Net Profit Margin, Return on Assets
   - **Efficiency Ratios**: Asset Turnover, Inventory Turnover
   - **Leverage Ratios**: Debt to Equity, Debt Ratio
4. **Verify**: All ratios are calculated correctly based on balance sheet and P&L data

---

## Phase 14: Advanced Books & Registers

### Step 37: Cash Book

1. Navigate to **Bookkeeping** (`/bookkeeping`)
2. Click on the **Cash Book** tab
3. **Review Cash Book**:
   - Select date range (From Date and To Date)
   - Click **Refresh** to generate
   - Opening balance for all cash ledgers
   - All cash transactions (debit and credit)
   - Running balance after each transaction
   - Closing balance
4. **Verify**: All cash ledger entries are included and balances are correct

### Step 38: Bank Book

1. Stay in **Bookkeeping** → **Bank Book** tab
2. **Review Bank Book**:
   - Select a specific bank ledger (if multiple exist)
   - Select date range (From Date and To Date)
   - Click **Refresh** to generate
   - Opening balance for the selected bank
   - All transactions affecting that bank
   - Running balance after each transaction
   - Closing balance
3. **Verify**: Only transactions for the selected bank are shown

### Step 39: Day Book

1. Stay in **Bookkeeping** → **Day Book** tab
2. **Review Day Book**:
   - Select a specific date
   - Click **Refresh** to generate
   - View all vouchers posted on that date
   - See all entries in each voucher
3. **Verify**: Only vouchers from the selected date are shown

### Step 40: Ledger Book

1. Stay in **Bookkeeping** → **Ledger Book** tab
2. **Review Ledger Book**:
   - Select a specific ledger name
   - Select date range (From Date and To Date)
   - Click **Refresh** to generate
   - Opening balance for that ledger
   - All voucher entries affecting that ledger
   - Running balance after each entry
   - Closing balance
3. **Verify**: All entries for the selected ledger are shown with correct balances

### Step 41: Journals

1. Stay in **Bookkeeping** → **Journals** tab
2. **Review Journals**:
   - Select a journal type (Sales, Purchase, Payment, Receipt, Contra, Journal)
   - Select date range (From Date and To Date)
   - Click **Refresh** to generate
   - View all vouchers of that type within the date range
   - See all entries in each voucher
3. **Verify**: Only vouchers of the selected type are shown

---

## Phase 15: Additional Features

### Step 42: Tally Import/Export

1. Navigate to **Import from Tally** (`/tally-import`)
2. **Template Download Section**:
   - Scroll to the "Sample Template" card
   - Click **Download Comprehensive Tally Template** button
   - Verify Excel file downloads
   - Open file and verify structure
3. **Import Tally Data**:
   - Upload an Excel file (.xlsx, .xls) or CSV file
   - Review the parsed data in the preview step
   - Click **Confirm & Import** button
   - Wait for import to complete
   - Verify import success and check imported data

### Step 43: Audit Log / Edit Trail

1. Navigate to **Audit Log** (`/audit-log`)
2. View summary cards and recent activity list
3. Apply filters (Entity Type, Action, Date Range, User)
4. Click on a specific log entry to view details (old vs new values, user, timestamp)
5. **Test Edit Log Toggle**:
   - Go to **Settings** → **Financial** tab → **Financial Year & Edit Log**
   - Toggle **Enable Edit Log** to `OFF`
   - Make a change (e.g., update a voucher)
   - Go back to **Audit Log** and verify non-critical actions are not logged
   - Toggle Edit Log back `ON`

### Step 44: Role Management

1. Navigate to **Role Management** (`/role-management`)
2. **Roles Tab**: View existing roles (Admin, Accountant, etc.)
3. **Create Custom Role**:
   - Click **Create Role**
   - Name: "Finance Manager"
   - Description: "Manages financial operations"
   - Assign permissions (voucher:create, voucher:read, bill:read, etc.)
   - Save role
4. **Permissions Tab**: View all available permissions, create custom permission if needed
5. **User Assignments Tab**: Assign roles to users
6. **Verify**: User access is updated based on assigned roles

### Step 45: Budgeting Module

1. Navigate to **Bookkeeping** (`/bookkeeping`)
2. Switch to the **Budgeting** tab
3. **Create Budget**:
   - Click "Create Budget" button
   - Fill in: Budget Name, Description, Period Start/End, Budget Type (Ledger/Group/Cost Centre), Amount
   - Click "Create Budget"
4. **View Variance Analytics**: Summary cards showing Total Budgeted, Total Actual, Total Variance, Number of Breaches
5. **View Budget Breaches**: Budgets that have exceeded limits

### Step 46: Year-End Operations

1. Stay in **Bookkeeping** → **Year-End Operations** tab
2. **Generate Closing Entries**:
   - Enter Financial Year End date
   - Add optional narration
   - Click "Generate Closing Entries"
   - Verify closing entry voucher is created
3. **Run Depreciation**:
   - Enter "As On Date"
   - Enter Depreciation Rate (default: 10%)
   - Click "Run Depreciation"
   - Verify depreciation voucher is created
4. **Carry Forward Balances**:
   - Enter "From" date (Financial Year End)
   - Enter "To" date (New Financial Year Start)
   - Click "Carry Forward Balances"
   - Verify opening balances are updated

### Step 47: Cost Centre Reporting

1. Navigate to **Cost Management** (`/cost-management`)
2. Switch to the **Cost Centre Reporting** tab
3. **Generate Report**:
   - Select a cost centre (optional - leave blank for all)
   - Select a date range (From Date and To Date)
   - Click "Generate Report"
4. **Verify Report**: Summary cards and detailed table showing sales, expenses, gross profit, net profit per cost centre

### Step 48: Exception Reports

1. Navigate to **Audit Log** (`/audit-log`)
2. Switch to the **Exception Reports** tab
3. **Generate Report**:
   - Select an "As On Date"
   - Click "Generate Report"
4. **Verify Exceptions**: Summary showing total exceptions, errors, and warnings
   - Exception types: NEGATIVE_BALANCE, CREDIT_LIMIT_EXCEEDED, UNBALANCED_VOUCHER, MISSING_OPENING_BALANCE
   - Each exception shows: Type, Ledger/Voucher name, Description, Severity, Amount

### Step 49: AI Workflows

1. Navigate to **AI Assistant** (`/ai-assistant`)
2. **Chatbot Tab**: Interact with AI, ask questions about financial data
3. **Scenarios Tab**: Run what-if scenarios (e.g., "What happens if we hire 2 engineers?")
4. **Insights Tab**: Generate financial insights and recommendations
5. **Forecasting Tab**: Generate forecasts for 3/6/12 months
6. **Verify**: AI responses are relevant to your actual voucher and financial data

---

## Quick Reference: What's Auto-Created vs. Manual

### ✅ Auto-Created on Signup

- Company Profile (basic details)
- Fiscal Configuration (default dates, allowBackdatedEntries: true, enableEditLog: false)
- Security Configuration (default settings)
- Currency Configuration (INR, ₹, 2 decimals)
- Feature Toggle (all features enabled)
- **All 13 Voucher Types**: Payment, Receipt, Contra, Journal, Sales, Purchase, Debit Note, Credit Note, Delivery Note, Receipt Note, Stock Journal, Memo, Reversing Journal (each with default numbering series)
- **Chart of Accounts**: All ledger groups
- **Default Ledgers**: Cash, Sales, Purchases

### ⚠️ Must Be Created Manually

- **Additional Ledgers**: Bank, Customer, Supplier, GST ledgers
- **Warehouses**: All warehouses
- **Items**: All items
- **Customers**: All customers (ledgers auto-created)
- **Suppliers**: Create supplier ledgers manually
- **GST Registrations**: All GST registrations
- **GST Tax Rates**: All tax rates
- **GST Ledger Mappings**: All mappings
- **Cost Categories**: All cost categories
- **Cost Centers**: All cost centers
- **Interest Profiles**: All interest calculation profiles
- **Party Interest Assignments**: Assign interest profiles to parties
- **Vouchers**: Create vouchers to test the posting engine
- **Bills**: Created automatically from vouchers with bill references
- **Budgets**: Create budgets for variance analysis
- **Purchase Vouchers**: Must create first to add stock before sales!

---

## Testing Checklist Summary

✅ **Account Setup**
- [x] Sign up new account
- [x] Company profile with multiple addresses
- [x] Fiscal configuration
- [x] Security settings
- [x] Currency configuration
- [x] Feature toggles

✅ **Chart of Accounts & Ledgers**
- [x] View ledger groups (auto-created)
- [x] Create essential ledgers (Bank, Customer, Supplier, GST)
- [x] Verify ledgers appear in register

✅ **Voucher Types**
- [x] View voucher types (auto-created)
- [x] Configure numbering series
- [x] Create additional series if needed

✅ **Inventory Setup**
- [x] Create warehouses
- [x] Create items with HSN/SAC and GST rates
- [x] **Create purchase vouchers FIRST to add stock**

✅ **GST Configuration**
- [x] Create GST registration
- [x] Create GST tax rates (all standard slabs)
- [x] Create GST ledger mappings

✅ **Customer Management**
- [x] Create customers (ledgers auto-created)
- [x] Verify customer ledgers in bookkeeping

✅ **Voucher Management**
- [x] Create purchase vouchers (to add stock)
- [x] Create sales vouchers (stock available)
- [x] Create payment/receipt vouchers
- [x] Create all 13 voucher types
- [x] Bill-wise references in vouchers
- [x] Voucher posting engine (Post/Cancel vouchers)
- [x] Inventory integration in Sales/Purchase vouchers
- [x] GST calculation and posting

✅ **Bill Management**
- [x] Bills created from vouchers
- [x] Bill settlement
- [x] Aging reports
- [x] Outstanding by ledger

✅ **Inventory Management**
- [x] Items Master (create items with HSN/SAC, GST rates, default rates)
- [x] Warehouses (create warehouses)
- [x] Inventory lines in Sales/Purchase vouchers
- [x] Stock movements (Delivery Note, Receipt Note, Stock Journal)
- [x] Stock validation (insufficient stock errors)

✅ **Cost Management**
- [x] Cost categories (hierarchical)
- [x] Cost centers (hierarchical)
- [x] Interest profiles
- [x] Party interest assignments
- [x] Cost centre reporting

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

✅ **Additional Features**
- [x] Audit Log
- [x] Role Management
- [x] Tally Import/Export
- [x] Budgeting
- [x] Year-End Operations
- [x] Exception Reports
- [x] AI Assistant

---

## Important Notes

1. **Stock Management**: Always create Purchase vouchers FIRST before Sales vouchers to ensure stock is available
2. **GST Setup**: Complete GST registration, tax rates, and ledger mappings before creating vouchers with GST
3. **Customer Ledgers**: Customer ledgers are auto-created when you create customers - no need to create manually
4. **Voucher Posting**: Only POSTED vouchers affect ledger balances and inventory stock
5. **Bill References**: Bills are automatically created when vouchers include bill references

---

**Happy Testing from Scratch! 🚀**

Build your company's financial setup step by step and test all features as you go!


# Complete Testing Workflow for All Features

This document provides a step-by-step workflow to test all implemented features from start to finish, starting with a **fresh account signup**.

## Prerequisites

- ✅ Database cleared and schema pushed (`npx prisma db push`)
- ✅ Backend server running
- ✅ Frontend server running
- ✅ **No seed script required** - We'll test with a fresh signup

---

## Phase 1: Account Creation & Initial Setup

### Step 1: User Registration

1. Navigate to `/register` or `/login` (then click "Sign Up")
2. **Create a new account**:
   - Email: Use a test email (e.g., `test@example.com`)
   - Password: At least 8 characters (e.g., `password123`)
   - Startup Name: Enter your company name (e.g., "Test Company")
   - First Name: Your first name
   - Last Name: Your last name
3. Click **Sign Up** or **Register**
4. **Verify**: You are automatically logged in and redirected to `/dashboard`

### Step 2: What's Automatically Created on Signup

Upon successful signup, the following is **automatically created**:

✅ **Company Profile**:
   - Display Name, Legal Name, Mailing Name
   - Base Currency: INR

✅ **Fiscal Configuration**:
   - Financial Year Start: Default date (April 1st of current year)
   - Financial Year End: Default date (March 31st of next year)
   - Books Start Date: Default date
   - Allow Backdated Entries: `true` (enabled)
   - Enable Edit Log: `false` (disabled by default)

✅ **Security Configuration**:
   - Default security settings

✅ **Currency Configuration**:
   - Base Currency: INR
   - Currency Symbol: ₹
   - Decimal Places: 2

✅ **Feature Toggle**:
   - All features enabled by default

✅ **8 Default Voucher Types** with default numbering series:
   - Payment (PMT/)
   - Receipt (RCT/)
   - Contra (CTR/)
   - Journal (JRN/)
   - Sales (SAL/)
   - Purchase (PUR/)
   - Debit Note (DN/)
   - Credit Note (CN/)

⚠️ **NOT Created on Signup** (must be created manually):
   - Chart of Accounts (Ledger Groups)
   - Ledgers
   - Warehouses
   - Items
   - GST Registrations
   - GST Tax Rates
   - GST Ledger Mappings
   - Additional Voucher Types (Delivery Note, Receipt Note, Stock Journal, Memo, Reversing Journal)

---

## Phase 2: Company Configuration

### Step 3: Company Profile Setup

1. Navigate to **Settings** (`/settings`)
2. Select the **General** tab and expand the **Company Profile** card
3. **View existing profile**: The profile created on signup should be displayed
4. **Update profile** (optional):
   - Modify company details if needed
   - Add additional addresses:
     - Click "Add Address"
     - Fill: Address Line 1, City, State, PIN, Country
     - Mark as Primary, Billing, or Shipping as needed
     - Add 2-3 addresses (Registered, Mailing, Branch)
   - Save changes
5. **Verify**: All addresses are saved and displayed

### Step 4: Fiscal Configuration

1. Stay in **Settings** → **Financial** tab
2. Open **Financial Year & Edit Log** card
3. **View existing config**: Default fiscal settings should be displayed
4. **Update configuration** (recommended):
   - Financial Year Start: `2024-04-01` (or your preferred date)
   - Financial Year End: `2025-03-31` (or your preferred date)
   - Books Start Date: `2024-04-01` (or your preferred date)
   - Allow Backdated Entries: `Yes` (toggle ON) - **Important for testing backdated vouchers**
   - Enable Edit Log: `Yes` (toggle ON) - **Important for audit trail testing**
5. Save changes
6. **Verify**: Settings are saved and displayed correctly

### Step 5: Security Settings

1. Switch to the **Security** tab in Settings
2. **View existing config**: Default security settings should be displayed
3. **Configure** (optional):
   - Enable **Vault Encryption** for company data (toggle ON and set a vault password if enabling)
   - Enable **User Access Controls** (toggle ON)
   - Enable **Multi-factor Authentication** for privileged roles (optional)
4. Save changes if modified

### Step 6: Currency Configuration

1. In **Settings** → **Financial** tab, open **Base Currency & Formatting** card
2. **View existing config**: Default currency settings (INR, ₹, 2 decimals) should be displayed
3. **Verify or update**:
   - Base Currency Code: `INR`
   - Currency Symbol: `₹`
   - Decimal Places: `2`
   - Show Amount in Millions: `No`
4. Save changes if modified

### Step 7: Feature Toggles

1. Switch to the **Billing & Subscription** tab → **Feature Access** section
2. **View existing toggles**: All features should be enabled by default
3. **Verify all modules** in **Feature Access**:
   - ✅ Accounting & Ledgers
   - ✅ Inventory & Stock
   - ✅ Tax & Compliance
   - ✅ Payroll & HR (may be disabled for starter plans)
   - ✅ AI Insights
   - ✅ Scenario Planning
   - ✅ Automations (may be disabled for starter plans)
   - ✅ Vendor Management (may be disabled for starter plans)
   - ✅ Billing & Invoicing
4. Enable any disabled features if needed
5. Save changes if modified

---

## Phase 3: Chart of Accounts & Ledger Setup

### Step 8: Create Ledger Groups (Chart of Accounts)

1. Navigate to **Bookkeeping** (`/bookkeeping`)
2. The **Chart of Accounts** tab should be active by default
3. **Note**: No ledger groups exist initially - you need to create them
4. In the **Ledger Groups** panel:
   - **Create root groups** using the form:
     - Name: "Capital Accounts", Category: "Capital", Parent: "Root Level"
     - Name: "Loans (Secured/Unsecured)", Category: "Loan", Parent: "Root Level"
     - Name: "Current Liabilities", Category: "Current Liability", Parent: "Root Level"
     - Name: "Bank Accounts", Category: "Bank Account", Parent: "Root Level"
     - Name: "Cash-in-hand", Category: "Cash", Parent: "Root Level"
     - Name: "Current Assets", Category: "Current Asset", Parent: "Root Level"
     - Name: "Purchase Accounts", Category: "Purchase", Parent: "Root Level"
     - Name: "Sales Accounts", Category: "Sales", Parent: "Root Level"
     - Name: "Direct Expenses", Category: "Direct Expense", Parent: "Root Level"
     - Name: "Indirect Expenses", Category: "Indirect Expense", Parent: "Root Level"
     - Name: "Direct Incomes", Category: "Direct Income", Parent: "Root Level"
     - Name: "Indirect Incomes", Category: "Indirect Income", Parent: "Root Level"
   - **Create sub-groups**:
     - Under "Current Liabilities":
       - Name: "Sundry Creditors", Category: "Sundry Creditor", Parent: "Current Liabilities"
       - Name: "Duties & Taxes", Category: "Current Liability", Parent: "Current Liabilities"
     - Under "Current Assets":
       - Name: "Sundry Debtors", Category: "Sundry Debtor", Parent: "Current Assets"
       - Name: "Stock-in-hand", Category: "Stock", Parent: "Current Assets"
5. Click **Add Group** for each entry
6. **Verify**:
   - All groups appear in the Chart of Accounts tree
   - Hierarchy renders correctly (child groups indented)

### Step 9: Create Essential Ledgers

1. Stay in **Bookkeeping** → **Ledgers** tab (click on "Ledger Master" tab)
2. Scroll to the **Create Ledger** card
3. **Create essential ledgers**:

   **Cash Ledger**:
   - Ledger Name: "Cash"
   - Under Group: Select "Cash-in-hand"
   - Ledger Subtype: "CASH"
   - Opening Balance: `50000`, Type: `Debit`
   - Click **Create Ledger**

   **Bank Ledger**:
   - Ledger Name: "HDFC Bank - Current Account"
   - Under Group: Select "Bank Accounts"
   - Ledger Subtype: "BANK"
   - Opening Balance: `1000000`, Type: `Debit`
   - Click **Create Ledger**

   **Sales Ledger**:
   - Ledger Name: "Sales"
   - Under Group: Select "Sales Accounts"
   - Opening Balance: `0`, Type: `Credit`
   - Click **Create Ledger**

   **Purchases Ledger**:
   - Ledger Name: "Purchases"
   - Under Group: Select "Purchase Accounts"
   - Opening Balance: `0`, Type: `Debit`
   - Click **Create Ledger**

   **Customer Ledger**:
   - Ledger Name: "ABC Corporation"
   - Under Group: Select "Sundry Debtors"
   - Ledger Subtype: "CUSTOMER"
   - Maintain Bill-by-bill: Enabled
   - Opening Balance: `0`, Type: `Debit`
   - Default Credit Period: `30`
   - Credit Limit: `500000` (optional)
   - Click **Create Ledger**

   **Supplier Ledger**:
   - Ledger Name: "Cloud Services Provider"
   - Under Group: Select "Sundry Creditors"
   - Ledger Subtype: "SUPPLIER"
   - Maintain Bill-by-bill: Enabled
   - Opening Balance: `0`, Type: `Credit`
   - Default Credit Period: `45`
   - Click **Create Ledger**

   **GST Ledgers** (for GST functionality):
   - Create 6 GST ledgers under "Duties & Taxes":
     - "GST Output CGST" (Output CGST)
     - "GST Output SGST" (Output SGST)
     - "GST Output IGST" (Output IGST)
     - "GST Input CGST" (Input CGST)
     - "GST Input SGST" (Input SGST)
     - "GST Input IGST" (Input IGST)

4. **Verify**:
   - Success toast appears for each ledger
   - All ledgers appear in the **Ledger Register** table
   - Ledgers show correct groups, subtypes, and opening balances

---

## Phase 4: Voucher Types & Numbering Setup

### Step 10: View and Configure Voucher Types

1. Navigate to **Settings** (`/settings`)
2. Go to the **Financial** tab
3. Scroll down to the **Voucher Types & Numbering** section
4. **View existing types**: You should see 8 voucher types created on signup:
   - Payment, Receipt, Contra, Journal, Sales, Purchase, Debit Note, Credit Note
5. **Create additional voucher types** (if needed):
   - Click **Add Voucher Type** button
   - Name: "Delivery Note" (required)
   - Category: "DELIVERY_NOTE" (required)
   - Abbreviation: "DN" (optional)
   - Prefix: "DN/" (optional)
   - Numbering Method: "Automatic" (default)
   - Numbering Behaviour: "Renumber" (default)
   - Click **Add Voucher Type**
   - Repeat for: Receipt Note, Stock Journal, Memo, Reversing Journal
6. **Verify**: All voucher types appear as cards with their configurations

### Step 11: Configure Numbering Series

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

### Step 12: Create Warehouses

1. Navigate to **Vouchers** → **Warehouses** (`/vouchers/warehouses`)
2. **Note**: No warehouses exist initially - you need to create them
3. **Create warehouses**:
   - Click **Add Warehouse** or **Create Warehouse** button
   - **Warehouse 1**:
     - Name: "Main Warehouse"
     - Alias: "WH-001" (optional)
     - Address: "123 Main St, Bengaluru, Karnataka, 560001"
     - Mark as Active
     - Click **Create** or **Save**
   - **Warehouse 2**:
     - Name: "Secondary Warehouse"
     - Alias: "WH-002"
     - Address: "456 Secondary St, Mumbai, Maharashtra, 400001"
     - Mark as Active
     - Click **Create**
   - **Warehouse 3**:
     - Name: "Storage Unit"
     - Alias: "WH-003"
     - Address: "789 Storage Rd, Gurugram, Haryana, 122001"
     - Mark as Active
     - Click **Create**
4. **Verify**: All warehouses appear in the warehouses list

### Step 13: Create Items

1. Navigate to **Vouchers** → **Items** (`/vouchers/items`)
2. **Note**: No items exist initially - you need to create them
3. **Create items**:
   - Click **Add Item** or **Create Item** button
   - **Item 1**:
     - Item Name: "Premium SaaS License"
     - Alias: "ITEM-001" (optional)
     - HSN/SAC: "998314"
     - Unit: "License"
     - Default Sales Rate: `24999`
     - Default Purchase Rate: `0` (if applicable)
     - GST Rate: `18`
     - Mark as Active
     - Click **Create** or **Save**
   - **Item 2**:
     - Item Name: "API Credits - 10K"
     - Alias: "ITEM-002"
     - HSN/SAC: "998314"
     - Unit: "Pack"
     - Default Sales Rate: `5000`
     - GST Rate: `18`
     - Mark as Active
     - Click **Create**
   - **Item 3**:
     - Item Name: "Cloud Server - Monthly"
     - Alias: "ITEM-003"
     - HSN/SAC: "998314"
     - Unit: "Month"
     - Default Sales Rate: `8000`
     - Default Purchase Rate: `6000`
     - GST Rate: `18`
     - Mark as Active
     - Click **Create**
   - **Item 4**:
     - Item Name: "Office Supplies"
     - Alias: "ITEM-004"
     - HSN/SAC: "48201000"
     - Unit: "Unit"
     - Default Sales Rate: `500`
     - Default Purchase Rate: `300`
     - GST Rate: `12`
     - Mark as Active
     - Click **Create**
4. **Verify**: All items appear in the items list with their HSN/SAC, GST rates, and default rates

---

## Phase 6: GST/Statutory Configuration

### Step 14: Create GST Registration

1. Navigate to **GST** (`/gst`)
2. **GST Registrations Tab** should be active by default
3. **Note**: No GST registrations exist initially - you need to create them
4. **Create GST registration**:
   - Click **Add Registration** or **Create Registration** button
   - GSTIN: "29AABCU9603R1ZX" (or your actual GSTIN)
   - Registration Type: "Regular" (select from dropdown)
   - State: "Karnataka" (select from dropdown)
   - State Code: "29" (auto-filled or enter manually)
   - Legal Name: "Test Company Private Limited" (or your company name)
   - Trade Name: "Test Company" (or your trade name)
   - Effective From: `2024-04-01` (or your preferred date)
   - Click **Create** or **Save**
5. **Verify**: GST registration appears in the registrations list

### Step 15: Create GST Tax Rates

1. Stay in **GST** → **Tax Rates** tab (click on "Tax Rates" tab)
2. **Note**: No GST tax rates exist initially - you must create them
3. Click **Create Tax Rate** button
4. **Create tax rates**:

   **GST 18% Rate**:
   - Registration: Select your GST registration (or leave as "Use default registration")
   - Supply Type: "Goods" (or "Services")
   - HSN / SAC: "998314" (or match your items' HSN/SAC)
   - Description: "GST 18% on services" (optional)
   - CGST (%): 9
   - SGST (%): 9
   - IGST (%): 18
   - Cess (%): 0
   - Effective From: (optional date)
   - Is Active: Checked
   - Click **Create**

   **GST 12% Rate**:
   - Supply Type: "Goods"
   - HSN / SAC: "48201000" (or match your items' HSN/SAC)
   - Description: "GST 12% on goods" (optional)
   - CGST (%): 6
   - SGST (%): 6
   - IGST (%): 12
   - Cess (%): 0
   - Click **Create**

   **GST 5% Rate** (optional):
   - Supply Type: "Goods"
   - HSN / SAC: "85287100" (example)
   - CGST (%): 2.5
   - SGST (%): 2.5
   - IGST (%): 5
   - Cess (%): 0
   - Click **Create**

5. **Verify**: All tax rates appear in the Tax Rates table with correct percentages

### Step 16: Create GST Ledger Mappings

1. Stay in **GST** → **Mappings** tab (click on "Mappings" tab)
2. **Note**: No GST ledger mappings exist initially - you must create them
3. Click **Create Ledger Mapping** button
4. **Create mappings**:

   **Output CGST Ledger**:
   - Registration: Select your GST registration (or leave as "Use default registration")
   - Mapping Type: "Output CGST"
   - Ledger Name: "GST Output CGST" (must match the ledger you created earlier)
   - Ledger Code: "OUTPUT-CGST" (optional)
   - Description: "CGST payable on outward supplies" (optional)
   - Click **Create**

   **Output SGST Ledger**:
   - Mapping Type: "Output SGST/UTGST"
   - Ledger Name: "GST Output SGST"
   - Ledger Code: "OUTPUT-SGST" (optional)
   - Click **Create**

   **Output IGST Ledger**:
   - Mapping Type: "Output IGST"
   - Ledger Name: "GST Output IGST"
   - Ledger Code: "OUTPUT-IGST" (optional)
   - Click **Create**

   **Input CGST Ledger**:
   - Mapping Type: "Input CGST"
   - Ledger Name: "GST Input CGST"
   - Ledger Code: "INPUT-CGST" (optional)
   - Click **Create**

   **Input SGST Ledger**:
   - Mapping Type: "Input SGST/UTGST"
   - Ledger Name: "GST Input SGST"
   - Ledger Code: "INPUT-SGST" (optional)
   - Click **Create**

   **Input IGST Ledger**:
   - Mapping Type: "Input IGST"
   - Ledger Name: "GST Input IGST"
   - Ledger Code: "INPUT-IGST" (optional)
   - Click **Create**

5. **Verify**: All mappings appear in the Ledger Mappings table with correct mapping types and ledger names

---

## Phase 7: Voucher Entry & Bill-wise Tracking

### Step 17: Understanding Voucher Forms

**All 13 voucher types have dedicated UI forms**:

- **Payment Voucher**: `/vouchers/payment` - Dedicated form
- **Receipt Voucher**: `/vouchers/receipt` - Dedicated form
- **Contra Voucher**: `/vouchers/contra` - Dedicated form
- **Journal Voucher**: `/vouchers/journal` - Dedicated form
- **Sales Voucher**: `/vouchers/sales` - Dedicated form with inventory lines and GST
- **Purchase Voucher**: `/vouchers/purchase` - Dedicated form with inventory lines and GST
- **Credit Note**: `/vouchers/credit-note` - Dedicated form
- **Debit Note**: `/vouchers/debit-note` - Dedicated form
- **Delivery Note**: `/vouchers/delivery-note` - Dedicated form
- **Receipt Note**: `/vouchers/receipt-note` - Dedicated form
- **Stock Journal**: `/vouchers/stock-journal` - Dedicated form
- **Memo Voucher**: `/vouchers/memo` - Dedicated form
- **Reversing Journal**: `/vouchers/reversing-journal` - Dedicated form

**Alternative**: You can also use the main voucher form at `/vouchers` for any voucher type, but dedicated forms are recommended for better UX.

### Step 18: Create Sales Voucher with Inventory and GST

1. Navigate to **Vouchers** (`/vouchers`) and click "Sales" in the Quick Create section, OR
2. Navigate directly to **Vouchers** → **Sales** (`/vouchers/sales`)
3. Fill voucher details:
   - Date: Today's date
   - Voucher Number: (Auto-generated from series)
   - Narration: "Sale to Customer ABC"
   - Customer Ledger: Select "ABC Corporation" (the customer ledger you created)
   - Billing Name: "ABC Corporation"
   - Billing Address: "Customer address"
   - Customer GSTIN: (optional)
   - Place of Supply State: "Karnataka" (or select based on customer location)
4. Add inventory lines:
   - Click "Add Item" or similar button
   - Item: Select "Premium SaaS License" (or another item you created)
   - Quantity: 2
   - Rate: 24,999 (default from item, can override)
   - Warehouse: Select "Main Warehouse"
   - Discount: (optional)
   - GST Rate: 18% (auto-filled from item, can override)
   - Line Amount: Auto-calculated (Quantity × Rate - Discount)
5. **Verify totals**:
   - Items Subtotal: Sum of all line amounts
   - Total Tax Amount: Calculated based on GST rates and place of supply
   - Total Invoice Amount: Items Subtotal + Total Tax
6. Add bill reference (optional):
   - Bill Type: "Receivable"
   - Bill Number: "BILL-001" (or auto-generated)
   - Bill Date: Today
   - Due Date: 30 days from today
   - Amount: Total Invoice Amount
7. Click **Save Voucher** or **Create Voucher**
8. **Verify**:
   - Voucher is created with status "DRAFT"
   - Inventory lines are saved
   - GST amounts are calculated correctly (CGST/SGST for same state, IGST for different state)
   - Bill is created automatically if bill reference provided
   - Click "Post Voucher" to post it (changes status to "POSTED" and triggers posting engine)

### Step 19: Create Purchase Voucher with Inventory and GST

1. Navigate to **Vouchers** → **Purchase** (`/vouchers/purchase`)
2. Fill voucher details:
   - Date: Today
   - Narration: "Purchase from Supplier XYZ"
   - Supplier Ledger: Select "Cloud Services Provider" (the supplier ledger you created)
   - Billing Name: "Cloud Services Provider"
   - Billing Address: "Supplier address"
   - Supplier GSTIN: (optional)
   - Place of Supply State: "Karnataka" (or select based on supplier location)
3. Add inventory lines:
   - Click "Add Item"
   - Item: Select "Cloud Server - Monthly" (or another item)
   - Quantity: 5
   - Rate: 8,000 (default from item, can override)
   - Warehouse: Select "Main Warehouse"
   - Discount: (optional)
   - GST Rate: 18% (auto-filled from item, can override)
   - Line Amount: Auto-calculated
4. **Verify totals**:
   - Items Subtotal: Sum of all line amounts
   - Total Tax Amount: Calculated based on GST rates and place of supply
   - Total Invoice Amount: Items Subtotal + Total Tax
5. Add bill reference (optional):
   - Bill Type: "Payable"
   - Bill Number: "BILL-002" (or auto-generated)
   - Due Date: 45 days from today
   - Amount: Total Invoice Amount
6. Click **Save Voucher**
7. **Verify**:
   - Voucher is created with status "DRAFT"
   - Inventory lines are saved
   - GST amounts are calculated correctly
   - Bill is created automatically if bill reference provided
   - Click "Post Voucher" to post it

### Step 20: Create Payment Voucher (Bill Settlement)

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
   - **Bill Reference**: Select existing bill "BILL-002" (if created in previous step)
   - Reference Type: "AGAINST" (to settle against existing bill)
   - Settlement Amount: 3,000
4. Click **Save Voucher**
5. **Verify**:
   - Voucher is created with status "DRAFT"
   - Click "Post Voucher" to post it
   - Check that bill status changed to "Partial" or "Settled" (if bill reference was provided)

### Step 21: Create Receipt Voucher (Bill Settlement)

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
   - **Bill Reference**: Select existing bill "BILL-001" (if created in previous step)
   - Reference Type: "AGAINST" (to settle against existing bill)
   - Settlement Amount: 5,000
4. Click **Save Voucher**
5. **Verify**:
   - Voucher is created with status "DRAFT"
   - Click "Post Voucher" to post it
   - Check that bill status changed to "Partial" or "Settled" (if bill reference was provided)

### Step 22: Create Other Voucher Types

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
   - Navigate to their respective dedicated forms:
     - Credit Note: `/vouchers/credit-note`
     - Debit Note: `/vouchers/debit-note`
     - Delivery Note: `/vouchers/delivery-note`
     - Receipt Note: `/vouchers/receipt-note`
     - Stock Journal: `/vouchers/stock-journal`
     - Memo: `/vouchers/memo`
     - Reversing Journal: `/vouchers/reversing-journal`
   - Fill entries as per the voucher type rules
   - Click **Save Voucher** (creates as DRAFT)
   - Click "Post Voucher" to post it

### Step 23: Test Voucher Posting Engine

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

## Phase 8: Inventory Management Testing

### Step 24: Test Inventory Stock Movements

1. **View Current Stock**:
   - Navigate to **Vouchers** → **Items** (`/vouchers/items`)
   - View stock balance for each item across all warehouses
   - **Note**: Initially, all items have 0 stock

2. **Test Stock Increase (Purchase/Receipt Note)**:
   - Create a **Purchase Voucher** with inventory lines:
     - Item: "Cloud Server - Monthly"
     - Quantity: 10
     - Warehouse: "Main Warehouse"
   - Post the voucher
   - **Verify**: Stock for "Cloud Server - Monthly" in "Main Warehouse" increases by 10

3. **Test Stock Decrease (Sales/Delivery Note)**:
   - Create a **Sales Voucher** with inventory lines:
     - Item: "Cloud Server - Monthly"
     - Quantity: 3
     - Warehouse: "Main Warehouse"
   - Post the voucher
   - **Verify**: Stock for "Cloud Server - Monthly" in "Main Warehouse" decreases by 3 (now 7)

4. **Test Stock Movement (Stock Journal)**:
   - Create a **Stock Journal** voucher (`/vouchers/stock-journal`):
     - Source Warehouse: "Main Warehouse"
     - Destination Warehouse: "Secondary Warehouse"
     - Item: "Cloud Server - Monthly"
     - Quantity: 2
   - Post the voucher
   - **Verify**: 
     - Stock in "Main Warehouse" decreases by 2 (now 5)
     - Stock in "Secondary Warehouse" increases by 2 (now 2)

5. **Test Stock Validation**:
   - Try to create a Sales voucher with quantity exceeding available stock → Should fail validation
   - Verify error message indicates insufficient stock

6. **Test Delivery Note and Receipt Note**:
   - **Delivery Note** (`/vouchers/delivery-note`): Creates inventory decrease without ledger entries
   - **Receipt Note** (`/vouchers/receipt-note`): Creates inventory increase without ledger entries
   - Create and post these vouchers to verify stock movements

---

## Phase 9: Bills Management

### Step 25: View Bills

1. Navigate to **Bills** (`/bills`)
2. View all bills:
   - Filter by Bill Type: Receivables / Payables
   - Filter by Status: Open / Partial / Settled
3. Verify bills created from vouchers are listed

### Step 26: Bill Aging Report

1. Stay in **Bills** page
2. Navigate to **Aging Report** section
3. View aging buckets:
   - Current (not overdue)
   - 1-30 days
   - 31-60 days
   - 61-90 days
   - Over 90 days
4. Verify bills are categorized correctly

### Step 27: Outstanding by Ledger

1. Stay in **Bills** page
2. Navigate to **Outstanding by Ledger** section
3. View party-wise outstanding:
   - Customer ABC: Outstanding amount
   - Supplier XYZ: Outstanding amount
4. Verify calculations are correct

### Step 28: Manual Bill Settlement

1. In **Bills** page, find an open bill
2. Click **Settle Bill**
3. Select voucher and entry for settlement
4. Enter settlement amount
5. Add remarks
6. Complete settlement
7. **Verify**: Bill status updated, outstanding reduced

---

## Phase 10: Cost Management Setup

### Step 29: Cost Categories

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

### Step 30: Cost Centers

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

### Step 31: Interest Profiles

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

### Step 32: Assign Interest to Parties

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

## Phase 11: Financial Statements & Reports

### Step 33: Trial Balance

1. Navigate to **Bookkeeping** (`/bookkeeping`)
2. Click on the **Trial Balance** tab
3. **View Trial Balance**:
   - Select a date using the date picker (defaults to today)
   - Click **Refresh** to generate the report
   - Review all ledger balances with debit and credit columns
   - Verify the total debit equals total credit
4. **Verify**: All ledgers with balances are listed, and totals match

### Step 34: Profit & Loss Statement

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

### Step 35: Balance Sheet

1. Stay in **Bookkeeping** → **Balance Sheet** tab
2. **Generate Balance Sheet**:
   - Select a date using the date picker (defaults to today)
   - Click **Refresh** to generate
3. **Review Report**:
   - **Liabilities & Capital**: View all liabilities and capital accounts
   - **Assets**: View all asset accounts
   - Verify totals match (Assets = Liabilities + Capital)
4. **Verify**: All asset, liability, and capital ledgers are properly categorized

### Step 36: Cash Flow Statement

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

### Step 37: Financial Ratios

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

## Phase 12: Advanced Books & Registers

### Step 38: Cash Book

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

### Step 39: Bank Book

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

### Step 40: Day Book

1. Stay in **Bookkeeping** → **Day Book** tab
2. **Review Day Book**:
   - Select a specific date
   - Click **Refresh** to generate
   - View all vouchers posted on that date
   - See all entries in each voucher
3. **Verify**: Only vouchers from the selected date are shown

### Step 41: Ledger Book

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

### Step 42: Journals

1. Stay in **Bookkeeping** → **Journals** tab
2. **Review Journals**:
   - Select a journal type (Sales, Purchase, Payment, Receipt, Contra, Journal)
   - Select date range (From Date and To Date)
   - Click **Refresh** to generate
   - View all vouchers of that type within the date range
   - See all entries in each voucher
3. **Verify**: Only vouchers of the selected type are shown

---

## Phase 13: Additional Features

### Step 43: Tally Import/Export

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

### Step 44: Audit Log / Edit Trail

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

### Step 45: Role Management

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

### Step 46: Budgeting Module

1. Navigate to **Bookkeeping** (`/bookkeeping`)
2. Switch to the **Budgeting** tab
3. **Create Budget**:
   - Click "Create Budget" button
   - Fill in: Budget Name, Description, Period Start/End, Budget Type (Ledger/Group/Cost Centre), Amount
   - Click "Create Budget"
4. **View Variance Analytics**: Summary cards showing Total Budgeted, Total Actual, Total Variance, Number of Breaches
5. **View Budget Breaches**: Budgets that have exceeded limits

### Step 47: Year-End Operations

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

### Step 48: Cost Centre Reporting

1. Navigate to **Cost Management** (`/cost-management`)
2. Switch to the **Cost Centre Reporting** tab
3. **Generate Report**:
   - Select a cost centre (optional - leave blank for all)
   - Select a date range (From Date and To Date)
   - Click "Generate Report"
4. **Verify Report**: Summary cards and detailed table showing sales, expenses, gross profit, net profit per cost centre

### Step 49: Exception Reports

1. Navigate to **Audit Log** (`/audit-log`)
2. Switch to the **Exception Reports** tab
3. **Generate Report**:
   - Select an "As On Date"
   - Click "Generate Report"
4. **Verify Exceptions**: Summary showing total exceptions, errors, and warnings
   - Exception types: NEGATIVE_BALANCE, CREDIT_LIMIT_EXCEEDED, UNBALANCED_VOUCHER, MISSING_OPENING_BALANCE
   - Each exception shows: Type, Ledger/Voucher name, Description, Severity, Amount

### Step 50: AI Workflows

1. Navigate to **AI Assistant** (`/ai-assistant`)
2. **Chatbot Tab**: Interact with AI, ask questions about financial data
3. **Scenarios Tab**: Run what-if scenarios (e.g., "What happens if we hire 2 engineers?")
4. **Insights Tab**: Generate financial insights and recommendations
5. **Forecasting Tab**: Generate forecasts for 3/6/12 months
6. **Verify**: AI responses are relevant to your actual voucher and financial data

---

## Quick Reference: What's Auto-Created vs. Manual

### ✅ Automatically Created on Signup

- Company Profile (basic details)
- Fiscal Configuration (default dates, allowBackdatedEntries: true, enableEditLog: false)
- Security Configuration (default settings)
- Currency Configuration (INR, ₹, 2 decimals)
- Feature Toggle (all features enabled)
- **8 Default Voucher Types**: Payment, Receipt, Contra, Journal, Sales, Purchase, Debit Note, Credit Note (each with default numbering series)

### ⚠️ Must Be Created Manually

- **Chart of Accounts**: All ledger groups
- **Ledgers**: All ledgers (Cash, Bank, Sales, Purchases, Customers, Suppliers, GST ledgers)
- **Warehouses**: All warehouses
- **Items**: All inventory items with HSN/SAC and GST rates
- **GST Registrations**: All GST registrations
- **GST Tax Rates**: All tax rates for different HSN/SAC codes
- **GST Ledger Mappings**: All 6 mappings (Output/Input CGST, SGST, IGST)
- **Additional Voucher Types**: Delivery Note, Receipt Note, Stock Journal, Memo, Reversing Journal
- **Cost Categories**: All cost categories
- **Cost Centers**: All cost centers
- **Interest Profiles**: All interest calculation profiles
- **Party Interest Assignments**: Assign interest profiles to parties
- **Vouchers**: All vouchers to test the posting engine
- **Bills**: Created automatically from vouchers with bill references
- **Budgets**: Create budgets for variance analysis

---

## Testing Checklist Summary

✅ **Company Setup**
- [x] Company profile with multiple addresses
- [x] Fiscal configuration
- [x] Security settings
- [x] Currency configuration
- [x] Feature toggles

✅ **Voucher Management**
- [x] Voucher types configuration (Settings → Financial tab) - **8 types auto-created, 5 additional can be created**
- [x] Numbering series setup (Settings → Financial tab) - **Default series auto-created**
- [x] Create vouchers with dedicated forms (all 13 types have dedicated forms)
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

✅ **Cost Management**
- [x] Bookkeeping ledger groups & ledger master (via `/bookkeeping`) - **Must create manually**
- [x] Ledgers with subtypes (Cash, Bank, Customer, Supplier, Sales, Purchase, GST) - **Must create manually**
- [x] Cost categories (hierarchical) - Categories tab
- [x] Cost centers (hierarchical) - Centers tab
- [x] Interest profiles - Interest tab
- [x] Party interest assignments - Party Interest tab

✅ **GST Configuration**
- [x] GST registrations - Registrations tab - **Must create manually**
- [x] Tax rates - Tax Rates tab - **Must create manually**
- [x] Ledger mappings - Mappings tab - **Must create manually**

✅ **Audit Trail**
- [x] View audit logs
- [x] Filter logs
- [x] Entity audit trail
- [x] Edit log toggle behavior

✅ **Role Management**
- [x] View roles and permissions
- [x] Create custom roles
- [x] Assign roles to users
- [x] Update permissions

✅ **Tally Import**
- [x] Template download
- [x] File upload and parsing
- [x] Data preview and validation
- [x] Import execution with progress tracking

✅ **AI Workflows**
- [x] AI Chatbot - Interactive chat interface (`/ai-assistant` → Chatbot tab)
- [x] AI Insights - Financial insights and recommendations (`/ai-assistant` → Insights tab)
- [x] AI Scenarios - What-if scenario analysis (`/ai-assistant` → Scenarios tab)
- [x] AI Forecasting - Financial forecasting (3/6/12 months) (`/ai-assistant` → Forecasting tab)

✅ **Financial Statements & Analytics**
- [x] Trial Balance - View trial balance report (Bookkeeping → Trial Balance tab)
- [x] Profit & Loss - View P&L statement (Bookkeeping → Profit & Loss tab)
- [x] Balance Sheet - View balance sheet (Bookkeeping → Balance Sheet tab)
- [x] Cash Flow - View cash flow statement (Bookkeeping → Cash Flow tab)
- [x] Financial Ratios - View financial ratios (Bookkeeping → Financial Ratios tab)

✅ **Advanced Books & Registers**
- [x] Cash Book - View all cash transactions (Bookkeeping → Cash Book tab)
- [x] Bank Book - View bank transactions (Bookkeeping → Bank Book tab)
- [x] Day Book - View all vouchers for a day (Bookkeeping → Day Book tab)
- [x] Ledger Book - View ledger-wise entries (Bookkeeping → Ledger Book tab)
- [x] Journals - View vouchers by type (Bookkeeping → Journals tab)

---

**Happy Testing! 🚀**

# Complete Testing Workflow for All Features

This document provides a step-by-step workflow to test all implemented features from start to finish.

## Prerequisites

- ✅ Database cleared and schema pushed (`npx prisma db push`)
- ✅ Backend server running
- ✅ Frontend server running
- ✅ User account created (or will create during testing)

---

## Phase 1: Initial Setup & Company Configuration

### Step 1: User Registration/Login

1. Navigate to `/login` or `/register`
2. **If new user**: Register with email, password, first name, last name
   - This automatically creates a startup and assigns Admin role
3. **If existing user**: Login with credentials
4. Verify you land on `/dashboard`

### Step 2: Company Profile Setup

1. Navigate to **Settings** (`/settings`)
2. Select the **General** tab and expand the **Company Profile** card:
   - Fill in company details:
     - Legal Name: "Test Company Pvt Ltd"
     - Mailing Name: "Test Company"
     - Email: "contact@testcompany.com"
     - Phone: "+91-1234567890"
   - Add multiple addresses:
     - Click "Add Address"
     - Fill: Address Line 1, City, State, PIN, Country
     - Add 2-3 addresses (Registered, Mailing, Branch)
   - Save changes
3. **Verify**: Check that all addresses are saved and displayed

### Step 3: Fiscal Configuration

1. Switch to the **Financial** tab and open **Financial Year & Edit Log**
2. Configure:
   - Financial Year Start: `2024-04-01`
   - Financial Year End: `2025-03-31`
   - Books Start Date: `2024-04-01`
   - Allow Backdated Entries: `Yes` (toggle ON)
   - Enable Edit Log: `Yes` (toggle ON) - **Important for audit trail testing**
3. Save changes

### Step 4: Security Settings

1. Switch to the **Security** tab
2. Configure:
   - Enable **Vault Encryption** for company data (toggle ON and set a vault password if enabling for the first time)
   - Enable **User Access Controls** (toggle ON)
   - Enable **Multi-factor Authentication** for privileged roles (optional, toggle ON when ready)
3. Save changes

### Step 5: Currency Configuration

1. In the **Financial** tab, open **Base Currency & Formatting**
2. Configure:
   - Base Currency Code: `INR`
   - Currency Symbol: `₹`
   - Decimal Places: `2`
   - Show Amount in Millions: `No`
3. Save changes

### Step 6: Feature Toggles

1. Switch to the **Billing & Subscription** tab → **Feature Access**
   - Confirm the plan summary shows `Startup (Free Earlybird)` with status `active`
2. Enable all modules/cards in **Feature Access**:
   - ✅ Accounting & Ledgers
   - ✅ Inventory & Stock
   - ✅ Tax & Compliance
   - ✅ Payroll & HR
   - ✅ AI Insights
   - ✅ Scenario Planning
   - ✅ Automations
   - ✅ Vendor Management
   - ✅ Billing & Invoicing
3. Save changes

### Step 6A: Create a Mock Bank Account

1. Navigate to **Banking & Payments** (`/banking-payments`)
2. In the **Mock Bank Accounts** card, click **Add Mock Account**
3. Complete the two-step wizard:
   - **Step 1 – Account Details:** Enter a friendly account name (e.g., "Operating Account") and click **Next**
   - **Step 2 – Opening Balance:** Provide the opening balance, review the summary, and click **Create Account**
4. **Verify**: The new mock account appears in the table and feeds the CFO dashboard totals

---

## Phase 2: Voucher Types & Numbering Setup

### Step 7: Configure Voucher Types

1. Navigate to **Settings** (`/settings`)
2. Go to the **Financial** tab
3. Scroll down to the **Voucher Types & Numbering** section
4. Review default voucher types (Payment, Receipt, Sales, Purchase, Journal, Contra) that are listed
5. Create a custom voucher type:
   - Name: "Credit Note" (required)
   - Category: "Sales" (required - select from dropdown)
   - Abbreviation: "CN" (optional)
   - Numbering Method: Select from dropdown (e.g., "Automatic", "Manual", etc.)
   - Numbering Behaviour: Select from dropdown
   - Prefix: "CN/" (optional)
   - Suffix: (optional)
   - Checkboxes: Allow manual override, Allow duplicate numbers (optional)
6. Click **Add Voucher Type** button
7. **Verify**: The new voucher type appears as its own card showing category, next number, and the configured numbering method/behaviour badges

### Step 8: Configure Numbering Series

1. Stay in **Settings** → **Financial** tab → **Voucher Types & Numbering** section
2. For each voucher type in the list, you can:
   - **Edit voucher type settings**: Update prefix, suffix, next number, and checkboxes
   - **Add numbering series**:
     - Scroll to the "Numbering Series" section within each voucher type card
     - Enter Series Name (e.g., "HO-2025")
     - Enter Prefix (optional)
     - Enter Suffix (optional)
     - Click **Add Series** button
   - **Preview next number**: Click "Preview Next Number" or "Preview Next" for a series
3. Example: For "Payment" voucher type:
   - Add a series: Name "PAY-2025", Prefix "PAY-", Suffix ""
   - Click **Add Series**
4. **Verify**: Series appear under each voucher type card with their details, and the preview button shows the formatted number that will be used

---

## Phase 3: Cost Management Setup

### Step 9: Cost Categories

1. Navigate to **Cost Management** (`/cost-management`)
2. **Cost Categories Tab**:
   - Create root categories:
     - "Revenue" (mark as Primary)
     - "Expenses"
     - "Assets"
   - Create sub-categories:
     - Under "Revenue": "Sales", "Services"
     - Under "Expenses": "Operations", "Marketing", "HR"
     - Under "Assets": "Fixed Assets", "Current Assets"
3. Verify hierarchical structure displays correctly

### Step 10: Cost Centers

1. Stay in **Cost Management** → **Cost Centers Tab**
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

### Step 11: Interest Profiles

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

---

## Phase 4: Bookkeeping & Ledger Master

### Step 12: Ledger Groups (Chart of Accounts)

1. Navigate to **Bookkeeping** (`/bookkeeping`)
2. In the **Ledger Groups** panel:
   - Create sample root groups using the provided dropdowns
     - Name: "Sundry Debtors", Category: "Current Assets", Parent: "Root Level"
     - Name: "Sundry Creditors", Category: "Current Liabilities", Parent: "Root Level"
   - Create sub-groups by selecting a parent from the list (e.g., "Online Customers" under "Sundry Debtors")
3. Click **Add Group** for each entry
4. **Verify**:
   - Newly created groups appear instantly in the Chart of Accounts tree
   - Hierarchy renders correctly (child groups indented, dashed connectors shown)

### Step 13: Ledger Creation

1. Scroll to the **Create Ledger** card
2. Populate the form with realistic data:
   - Ledger Name: "Customer ABC"
   - Under Group: "Sundry Debtors"
   - Maintain Bill-by-bill: Enabled
   - Opening Balance: `50000`, Type: `Debit`
   - Default Credit Period: `30`
   - Interest Method: Simple, Rate: 12
   - PAN/GST/Address/Bank sections: fill sample values
3. Click **Create Ledger**
4. **Verify**:
   - Success toast appears
   - Ledger shows up in the **Ledger Register** table with the selected group, flags, and opening balance

### Step 14: Persistence & Reload

1. Refresh the page (or navigate away and return to `/bookkeeping`)
2. **Verify**:
   - Ledger groups and ledgers created above are fetched from the backend and still visible
   - The Chart of Accounts panel states the correct total count

### Step 15: Validation & Error States

1. Attempt to create a ledger without selecting a group → ensure validation prevents submission
2. Try deleting a ledger group that still has child groups or ledgers → confirm the API returns a validation error banner
3. Delete a leaf group and a ledger to confirm the UI refreshes and the items disappear

---

## Phase 5: GST/Statutory Configuration

### Step 16: GST Registrations

1. Navigate to **GST** (`/gst`)
2. **GST Registrations Tab**:
   - Add registration:
     - GSTIN: "27AABCU9603R1ZX"
     - Registration Type: "Regular"
     - State: "Maharashtra"
     - Effective From: `2024-04-01`
   - Add another registration (if multi-state):
     - GSTIN: "29AABCU9603R1ZY"
     - Registration Type: "Regular"
     - State: "Karnataka"
3. Save all registrations

### Step 17: GST Tax Rates

1. Stay in **GST** → **Tax Rates** tab (click on "Tax Rates" tab)
2. Click **Create Tax Rate** button
3. Create tax rates:
   - **GST 18% Rate:**
     - Registration: Select your GST registration (or leave as "Use default registration")
     - Supply Type: "Goods" (or "Services")
     - HSN / SAC: "85171200" (example HSN code)
     - Description: "GST 18% on goods" (optional)
     - CGST (%): 9
     - SGST (%): 9
     - IGST (%): 18
     - Cess (%): 0
     - Effective From: (optional date)
     - Effective To: (optional date)
     - Is Active: Checked
   - **GST 5% Rate:**
     - Supply Type: "Goods"
     - HSN / SAC: "85287100" (example)
     - Description: "GST 5% on goods" (optional)
     - CGST (%): 2.5
     - SGST (%): 2.5
     - IGST (%): 5
     - Cess (%): 0
   - **GST 0% Rate:**
     - Supply Type: "Goods"
     - HSN / SAC: "1001" (example)
     - Description: "GST 0% on goods" (optional)
     - CGST (%): 0
     - SGST (%): 0
     - IGST (%): 0
     - Cess (%): 0
4. Click **Create** (or **Update** if editing) button for each rate
5. **Verify**: All tax rates appear in the Tax Rates table with correct percentages

### Step 18: GST Ledger Mappings

1. Stay in **GST** → **Mappings** tab (click on "Mappings" tab)
2. Click **Create Ledger Mapping** button
3. Create mappings for different tax types:
   - **Output CGST Ledger:**
     - Registration: Select your GST registration (or leave as "Use default registration")
     - Mapping Type: "Output CGST"
     - Ledger Name: "Output CGST Payable" (required)
     - Ledger Code: "OUTPUT-CGST" (optional)
     - Description: "CGST payable on outward supplies" (optional)
   - **Output SGST Ledger:**
     - Mapping Type: "Output SGST/UTGST"
     - Ledger Name: "Output SGST Payable"
     - Ledger Code: "OUTPUT-SGST" (optional)
   - **Output IGST Ledger:**
     - Mapping Type: "Output IGST"
     - Ledger Name: "Output IGST Payable"
     - Ledger Code: "OUTPUT-IGST" (optional)
   - **Input CGST Ledger:**
     - Mapping Type: "Input CGST"
     - Ledger Name: "Input CGST Credit"
     - Ledger Code: "INPUT-CGST" (optional)
   - **Input SGST Ledger:**
     - Mapping Type: "Input SGST/UTGST"
     - Ledger Name: "Input SGST Credit"
     - Ledger Code: "INPUT-SGST" (optional)
   - **Input IGST Ledger:**
     - Mapping Type: "Input IGST"
     - Ledger Name: "Input IGST Credit"
     - Ledger Code: "INPUT-IGST" (optional)
4. Save each mapping after filling the required fields (Mapping Type and Ledger Name are required; Registration and other fields are optional)
5. **Verify**: All mappings are listed in the Ledger Mappings table with correct mapping types and ledger names

---

## Phase 6: Voucher Entry & Bill-wise Tracking

### Step 19: Create Sales Voucher with Bill Reference

1. Navigate to **Vouchers** (`/vouchers`)
2. Click **Create Voucher**
3. Select voucher type: **Sales**
4. Fill voucher details:
   - Date: Today's date
   - Voucher Number: (Auto-generated from series)
   - Narration: "Sale to Customer ABC"
5. Add voucher entries:
   - Entry 1:
     - Ledger: "Sales Account" (or create new)
     - Entry Type: "Credit"
     - Amount: 10,000
     - Cost Category: "Revenue" → "Sales"
     - Cost Center: (optional)
   - Entry 2:
     - Ledger: "Customer ABC" (create new party ledger)
     - Entry Type: "Debit"
     - Amount: 10,000
     - **Bill Reference**:
       - Bill Type: "Receivable"
       - Bill Number: "BILL-001"
       - Bill Date: Today
       - Due Date: 30 days from today
       - Amount: 10,000
6. Save voucher
7. **Verify**: Check that bill is created automatically

### Step 20: Create Purchase Voucher with Bill Reference

1. Create another voucher: **Purchase**
2. Fill details:
   - Date: Today
   - Narration: "Purchase from Supplier XYZ"
3. Add entries:
   - Entry 1: "Purchase Account" (Credit) - 5,000
   - Entry 2: "Supplier XYZ" (Debit) - 5,000
     - **Bill Reference**:
       - Bill Type: "Payable"
       - Bill Number: "BILL-002"
       - Due Date: 45 days from today
       - Amount: 5,000
4. Save voucher

### Step 21: Create Payment Voucher (Bill Settlement)

1. Create **Payment** voucher
2. Fill details:
   - Date: Today
   - Narration: "Payment to Supplier XYZ"
3. Add entries:
   - Entry 1: "Bank Account" (Credit) - 3,000
   - Entry 2: "Supplier XYZ" (Debit) - 3,000
     - **Bill Reference**: Select existing bill "BILL-002"
     - Settlement Amount: 3,000
4. Save voucher
5. **Verify**: Check that bill status changed to "Partial" or "Settled"

### Step 22: Create Receipt Voucher (Bill Settlement)

1. Create **Receipt** voucher
2. Fill details:
   - Date: Today
   - Narration: "Receipt from Customer ABC"
3. Add entries:
   - Entry 1: "Bank Account" (Debit) - 5,000
   - Entry 2: "Customer ABC" (Credit) - 5,000
     - **Bill Reference**: Select existing bill "BILL-001"
     - Settlement Amount: 5,000
4. Save voucher

---

## Phase 7: Bills Management

### Step 23: View Bills

1. Navigate to **Bills** (`/bills`)
2. View all bills:
   - Filter by Bill Type: Receivables / Payables
   - Filter by Status: Open / Partial / Settled
3. Verify bills created from vouchers are listed

### Step 24: Bill Aging Report

1. Stay in **Bills** page
2. Navigate to **Aging Report** section
3. View aging buckets:
   - Current (not overdue)
   - 1-30 days
   - 31-60 days
   - 61-90 days
   - Over 90 days
4. Verify bills are categorized correctly

### Step 25: Outstanding by Ledger

1. Stay in **Bills** page
2. Navigate to **Outstanding by Ledger** section
3. View party-wise outstanding:
   - Customer ABC: Outstanding amount
   - Supplier XYZ: Outstanding amount
4. Verify calculations are correct

### Step 26: Manual Bill Settlement

1. In **Bills** page, find an open bill
2. Click **Settle Bill**
3. Select voucher and entry for settlement
4. Enter settlement amount
5. Add remarks
6. Complete settlement
7. **Verify**: Bill status updated, outstanding reduced

---

## Phase 8: Cost Management - Interest Assignment

### Step 27: Assign Interest to Parties

1. Navigate to **Cost Management** (`/cost-management`)
2. Open the **Party Interest** tab
3. Click **Add Party** and create a record:
   - Name, type (Customer/Supplier/Employee/Other), optional email/phone
   - Opening balance & balance type are optional but useful for context
4. After saving, click **Assign Interest**
   - **Interest Profile:** pick the profile you created earlier (e.g., "Standard Receivables")
   - **Party:** choose the party from the dropdown (no manual IDs required)
   - Configure optional override rate, effective dates, and whether it applies to Receivables and/or Payables
5. Click **Assign**
6. **Verify:** The new row appears in the Party Interest table with the correct party, profile, and badges
7. Repeat for additional parties as needed

---

## Phase 9: Tally Import/Export

### Step 28: Download Tally Import Template

1. Navigate to **Import from Tally** (`/tally-import`)
2. **Template Download Section**:
   - Scroll to the "Sample Template" card
   - Click **Download Comprehensive Tally Template** button
   - Verify Excel file downloads (filename: `Tally_Import_Template.xlsx`)
   - Open file and verify structure:
     - Should contain 25+ ledgers
     - Should contain 6 parties
     - Should contain 30+ transactions across all voucher types
     - Should demonstrate real-world Tally export formats

### Step 29: Import Tally Data

1. Stay in **Import from Tally** page
2. **Import Process**:
   - **Upload File**:
     - Drag and drop an Excel file (.xlsx, .xls) or CSV file, OR
     - Click to browse and select a file
     - The file should be exported from Tally (Export → Excel Format)
   - **Preview Step**:
     - Review the parsed data showing:
       - Ledgers to import
       - Parties to import
       - Summary statistics
     - Check for any errors or warnings
     - If errors exist, fix them before proceeding
   - **Confirm Step**:
     - Review the import summary
     - Click **Confirm & Import** button
   - **Processing Step**:
     - Wait for the import to complete (progress bar will show)
   - **Complete Step**:
     - Verify import success message
     - Check the summary of imported data (ledgers, parties, transactions)
     - Click **Import Another File** to import more data, or navigate away
3. **Verify**:
   - Check that vouchers are created with correct types and series
   - Verify ledgers and parties are imported correctly
   - Check that all transactions are properly recorded

---

## Phase 10: Audit Log / Edit Trail

### Step 30: View Audit Logs

1. Navigate to **Audit Log** (`/audit-log`)
2. View summary cards:
   - Total logs
   - Logs by action (CREATE, UPDATE, DELETE)
   - Logs by entity type
3. View recent activity list

### Step 31: Filter Audit Logs

1. Stay in **Audit Log** page
2. Apply filters:
   - Entity Type: "VOUCHER"
   - Action: "CREATE"
   - Date Range: Last 7 days
   - User: (select specific user)
3. Verify filtered results

### Step 32: View Entity Audit Trail

1. In **Audit Log** page
2. Click on a specific log entry
3. View details:
   - Old values vs New values
   - User who made change
   - Timestamp
   - IP address (if available)
4. Verify all changes are logged

### Step 33: Test Edit Log Toggle

1. Go to **Settings** → **Financial** tab → **Financial Year & Edit Log**
2. Toggle **Enable Edit Log** to `OFF`
3. Make a change (e.g., update a voucher)
4. Go back to **Audit Log**
5. **Verify**: Non-critical actions are not logged (only DELETE, APPROVE, REJECT should be logged)
6. Toggle Edit Log back `ON`

---

## Phase 11: Role Management

### Step 34: View Roles

1. Navigate to **Role Management** (`/role-management`)
2. **Roles Tab**:
   - View existing roles (Admin, Accountant, etc.)
   - See permission count per role
   - See user count per role

### Step 35: Create Custom Role

1. Stay in **Role Management** → **Roles Tab**
2. Click **Create Role**
3. Fill details:
   - Name: "Finance Manager"
   - Description: "Manages financial operations"
4. Assign permissions:
   - Select permissions:
     - `voucher:create`
     - `voucher:read`
     - `voucher:update`
     - `bill:read`
     - `bill:settle`
     - `gst:read`
5. Save role

### Step 36: Manage Permissions

1. Go to **Permissions Tab**
2. View all available permissions
3. Create custom permission (if needed):
   - Action: "export"
   - Subject: "reports"
   - Description: "Export financial reports"
4. Save permission

### Step 37: Assign Roles to Users

1. Go to **User Assignments Tab**
2. View all users with their roles
3. Assign role to user:
   - Select a user
   - Click **Assign Role**
   - Select "Finance Manager" role
   - Save
4. **Verify**: User now has the assigned role

### Step 38: Update Role Permissions

1. Go back to **Roles Tab**
2. Edit "Finance Manager" role
3. Add/remove permissions
4. Save changes
5. **Verify**: User's access is updated

---

## Phase 12: AI Workflows with Voucher Data

### Step 39: AI Chatbot Interaction

1. Navigate to **AI Assistant** (`/ai-assistant`)
2. The **Chatbot** tab should be active by default
3. **Interact with AI**:
   - Type a question or request in the chat input (e.g., "Show me my recent vouchers", "What's my cash flow?", "Analyze my expenses")
   - Press Enter or click Send
   - Wait for AI response
4. **Note**: After sending the first message, the introductory content (header, banner, descriptions) will automatically hide to focus on the chat interface
5. **Continue Chatting**:
   - Ask follow-up questions
   - Request analysis of your financial data
   - Get insights about vouchers, bills, and other financial data
6. **Verify**: AI responses are relevant to your actual data

### Step 40: AI Scenarios Analysis

1. Navigate to **AI Assistant** (`/ai-assistant`)
2. Click on the **Scenarios** tab
3. **Run a Scenario**:
   - Type a scenario in the text area, OR
   - Click one of the example scenarios (e.g., "What happens if we hire 2 engineers at $150k/year each?")
   - Click **Run Scenario** button
4. **Review Results**:
   - View the scenario analysis output
   - Review financial impact calculations
   - Check recommendations and insights
5. **Verify**: Analysis uses real voucher and financial data

### Step 41: AI-Powered Insights

1. Stay in **AI Assistant** (`/ai-assistant`)
2. Click on the **Insights** tab
3. **Generate Insights**:
   - Click **Generate Insights** button
   - Wait for AI to analyze your financial data
4. **Review Insights**:
   - **Key Metrics**: View cash flow, runway, burn rate, and revenue projections
   - **Recommendations**: Review actionable recommendations with impact and effort
   - **Alerts**: Check any financial alerts or warnings
5. **Verify**: Insights are based on actual vouchers and financial data created

### Step 42: AI Forecasting

1. Navigate to **AI Assistant** (`/ai-assistant`)
2. Click on the **Forecasting** tab
3. **Generate Forecast**:
   - Select forecast period: 3 months / 6 months / 12 months
   - Click **Generate Forecast** button
   - Wait for AI to generate forecast
4. **Review Forecast**:
   - View forecasted metrics and trends
   - Review insights and recommendations
   - Check projected financial outcomes
5. **Verify**: Forecast uses recent voucher and financial data for calculations

---

## Phase 13: Final Verification

### Step 43: Dashboard Verification

1. Navigate to **Dashboard** (`/dashboard`)
2. Verify:
   - AI insights are displayed
   - Recent activity shows vouchers created
   - Cashflow chart (if applicable)
   - Summary metrics

### Step 44: Data Consistency Check

1. Cross-verify data across modules:
   - **Vouchers**: Check voucher totals
   - **Bills**: Check outstanding amounts match voucher entries
   - **GST**: Verify tax calculations
   - **Cost Management**: Verify cost center assignments
   - **Audit Log**: Verify all changes are logged
2. Check for any inconsistencies

### Step 45: Tally Import Round-trip

1. Export data from Tally (if you have Tally setup)
2. Import the exported file using **Import from Tally** (`/tally-import`)
3. **Verify**:
   - All vouchers are imported correctly
   - Ledgers and parties are created
   - Bill references are maintained
   - GST data is imported if present

### Step 46: Role-Based Access Test

1. Create a test user with limited role
2. Login as that user
3. **Verify**: User can only access permitted features
4. Try to access restricted features
5. **Verify**: Access is denied appropriately

---

## Testing Checklist Summary

✅ **Company Setup**

- [x] Company profile with multiple addresses
- [x] Fiscal configuration
- [x] Security settings
- [x] Currency configuration
- [x] Feature toggles

✅ **Voucher Management**

- [x] Voucher types configuration (Settings → Financial tab)
- [x] Numbering series setup (Settings → Financial tab)
- [x] Create vouchers (Sales, Purchase, Payment, Receipt, Journal, Contra)
- [x] Bill-wise references in vouchers

✅ **Bill Management**

- [x] Bills created from vouchers
- [x] Bill settlement
- [x] Aging reports
- [x] Outstanding by ledger

✅ **Cost Management**

- [x] Bookkeeping ledger groups & ledger master (via `/bookkeeping`)

- [x] Cost categories (hierarchical) - Categories tab
- [x] Cost centers (hierarchical) - Centers tab
- [x] Interest profiles - Interest tab
- [x] Party interest assignments - Party Interest tab

✅ **GST Configuration**

- [x] GST registrations - Registrations tab
- [x] Tax rates - Tax Rates tab
- [x] Ledger mappings - Mappings tab

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

- [x] AI Chatbot - Interactive chat interface
- [x] AI Insights - Financial insights and recommendations
- [x] AI Scenarios - What-if scenario analysis
- [x] AI Forecasting - Financial forecasting (3/6/12 months)

✅ **Financial Statements & Analytics**

- [x] Trial Balance - View trial balance report (Bookkeeping → Trial Balance tab)
- [x] Profit & Loss - View P&L statement with trading and P&L accounts (Bookkeeping → Profit & Loss tab)
- [x] Balance Sheet - View balance sheet with assets, liabilities, and capital (Bookkeeping → Balance Sheet tab)
- [x] Cash Flow - View cash flow statement with operating, investing, and financing activities (Bookkeeping → Cash Flow tab)
- [x] Financial Ratios - View liquidity, profitability, efficiency, and leverage ratios (Bookkeeping → Financial Ratios tab)

✅ **Advanced Books & Registers**

- [x] Cash Book - View all cash transactions with running balance (via API: `/bookkeeping/cash-book`)
- [x] Bank Book - View all bank transactions for a specific bank ledger (via API: `/bookkeeping/bank-book`)
- [x] Day Book - View all vouchers for a specific day (via API: `/bookkeeping/day-book`)
- [x] Ledger Book - View all entries for a specific ledger with running balance (via API: `/bookkeeping/ledger-book`)
- [x] Journals - View vouchers by type (Sales, Purchase, Payment, Receipt, Contra, Journal) (via API: `/bookkeeping/journals`)

---

## Phase 14: Financial Statements & Reports

### Step 47: Trial Balance

1. Navigate to **Bookkeeping** (`/bookkeeping`)
2. Click on the **Trial Balance** tab
3. **View Trial Balance**:
   - Select a date using the date picker (defaults to today)
   - Click **Refresh** to generate the report
   - Review all ledger balances with debit and credit columns
   - Verify the total debit equals total credit
4. **Verify**: All ledgers with balances are listed, and totals match

### Step 48: Profit & Loss Statement

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

### Step 49: Balance Sheet

1. Stay in **Bookkeeping** → **Balance Sheet** tab
2. **Generate Balance Sheet**:
   - Select a date using the date picker (defaults to today)
   - Click **Refresh** to generate
3. **Review Report**:
   - **Liabilities & Capital**: View all liabilities and capital accounts
   - **Assets**: View all asset accounts
   - Verify totals match (Assets = Liabilities + Capital)
4. **Verify**: All asset, liability, and capital ledgers are properly categorized

### Step 50: Cash Flow Statement

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

### Step 51: Financial Ratios

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

## Phase 15: Receivables & Payables Automation

### Step 51: Bill Reminders

1. Navigate to **Bills** (`/bills`)
2. Switch between **Receivables** and **Payables** tabs
3. **Verify Reminders Section**:
   - The Bill Reminders card should appear if there are bills approaching due date or overdue
   - Reminders show:
     - Bill number
     - Overdue status with color coding (red for overdue, orange for urgent, yellow for warning)
     - Days overdue or days until due
     - Ledger name and outstanding amount
     - Due date
   - Test with bills that:
     - Are overdue (>0 days past due date)
     - Are due within 3 days (URGENT)
     - Are due within 7 days (WARNING)

### Step 52: Cash Flow Projections

1. In the **Bills** page, scroll to the **Cash Flow Projections** section
2. **Verify Projections**:
   - 6-month projection table showing:
     - Month (formatted as "MMM yyyy")
     - Receivables Expected (green)
     - Payables Expected (red)
     - Net Cash Flow (green if positive, red if negative)
   - Projections are based on outstanding bills and their due dates
   - Each month shows expected receivables and payables based on bill due dates

### Step 53: Receivables & Payables Analytics

1. In the **Bills** page, scroll to the **Analytics** section
2. **Verify Receivables Analytics Card**:
   - Total receivables amount
   - Outstanding receivables (amber)
   - Settled receivables (green)
   - Collection rate (percentage)
   - Average collection days
3. **Verify Payables Analytics Card**:
   - Total payables amount
   - Outstanding payables (amber)
   - Settled payables (green)
   - Payment rate (percentage)
   - Average payment days
4. **Verify** that analytics reflect real bill data from the database

---

## Phase 16: Advanced Books & Registers

### Step 54: Cash Book

1. Navigate to **Bookkeeping** (`/bookkeeping`)
2. Use API endpoint or UI (if implemented) to view Cash Book:
   - GET `/api/v1/bookkeeping/cash-book?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD`
   - Or access via UI tab if available
3. **Review Cash Book**:
   - Opening balance for all cash ledgers
   - All cash transactions (debit and credit)
   - Running balance after each transaction
   - Closing balance
4. **Verify**: All cash ledger entries are included and balances are correct

### Step 55: Bank Book

1. Use API endpoint to view Bank Book:
   - GET `/api/v1/bookkeeping/bank-book?bankLedgerName=BankName&fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD`
   - Or access via UI tab if available
2. **Review Bank Book**:
   - Select a specific bank ledger (if multiple exist)
   - Opening balance for the selected bank
   - All transactions affecting that bank
   - Running balance after each transaction
   - Closing balance
3. **Verify**: Only transactions for the selected bank are shown

### Step 56: Day Book

1. Use API endpoint to view Day Book:
   - GET `/api/v1/bookkeeping/day-book?date=YYYY-MM-DD`
   - Or access via UI tab if available
2. **Review Day Book**:
   - Select a specific date
   - View all vouchers posted on that date
   - See all entries in each voucher
3. **Verify**: Only vouchers from the selected date are shown

### Step 57: Ledger Book

1. Use API endpoint to view Ledger Book:
   - GET `/api/v1/bookkeeping/ledger-book?ledgerName=LedgerName&fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD`
   - Or access via UI tab if available
2. **Review Ledger Book**:
   - Select a specific ledger name
   - Opening balance for that ledger
   - All voucher entries affecting that ledger
   - Running balance after each entry
   - Closing balance
3. **Verify**: All entries for the selected ledger are shown with correct balances

### Step 58: Journals

1. Use API endpoint to view Journals:
   - GET `/api/v1/bookkeeping/journals?journalType=SALES&fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD`
   - Journal types: SALES, PURCHASE, PAYMENT, RECEIPT, CONTRA, JOURNAL
   - Or access via UI tab if available
2. **Review Journals**:
   - Select a journal type
   - View all vouchers of that type within the date range
   - See all entries in each voucher
3. **Verify**: Only vouchers of the selected type are shown

---

## Notes

- **Data Flow**: Vouchers → Bills → Settlements → Reports
- **Audit Trail**: All changes should be logged (when Edit Log is enabled)
- **Permissions**: Test with different user roles
- **GST**: Verify tax calculations match configured rates
- **Bills**: Outstanding amounts should reconcile with voucher entries

## Troubleshooting

If any step fails:

1. Check browser console for errors
2. Check backend logs
3. Verify database schema is up to date
4. Check API responses in Network tab
5. Verify all required fields are filled

---

## Phase 16: Ledger Master Enhancements & Credit Limit Enforcement

### Step 59: Credit Limit Enforcement

1. **Setup**:

   - Navigate to **Bookkeeping** > **Ledgers** tab
   - Create or edit a ledger (e.g., a customer ledger)
   - Set a credit limit (e.g., 10,000)
   - Save the ledger

2. **Test Credit Limit**:

   - Navigate to **Vouchers** (`/vouchers`)
   - Create a new Receipt voucher with a CREDIT entry to the ledger
   - Try to credit an amount that would exceed the limit
   - **Expected**: The voucher creation should fail with an error message indicating credit limit exceeded
   - Try with an amount within the limit - should succeed

3. **Verify Current Balance**:
   - The system should calculate current credit balance before allowing new transactions
   - Credit limits are enforced automatically on voucher posting

## Phase 17: Cost Centre Reporting

### Step 60: Cost Centre P&L Report

1. Navigate to **Cost Management** (`/cost-management`)
2. Switch to the **Cost Centre Reporting** tab
3. **Generate Report**:
   - Select a cost centre (optional - leave blank for all)
   - Select a date range (From Date and To Date)
   - Click "Generate Report"
4. **Verify Report**:
   - Summary cards showing:
     - Total Sales
     - Total Expense (Direct + Indirect)
     - Gross Profit
     - Net Profit
   - Detailed table showing each cost centre with:
     - Sales, Purchase, Direct Income, Indirect Income
     - Direct Expense, Indirect Expense
     - Gross Profit, Net Profit
   - Test with different cost centres and date ranges

## Phase 18: Exception Reports & Audit Compliance

### Step 61: Exception Reports

1. Navigate to **Audit Log** (`/audit-log`)
2. Switch to the **Exception Reports** tab
3. **Generate Report**:
   - Select an "As On Date"
   - Click "Generate Report"
4. **Verify Exceptions**:
   - Summary showing total exceptions, errors, and warnings
   - Exception types should include:
     - **NEGATIVE_BALANCE**: Asset ledgers with credit balances, liability ledgers with debit balances
     - **CREDIT_LIMIT_EXCEEDED**: Ledgers exceeding their credit limits
     - **UNBALANCED_VOUCHER**: Vouchers where debit doesn't equal credit
     - **MISSING_OPENING_BALANCE**: Ledgers with transactions but no opening balance
   - Each exception shows:
     - Type, Ledger/Voucher name, Description, Severity (ERROR/WARNING), Amount
   - Test by creating scenarios that trigger exceptions

### Step 62: Exception Scenarios

1. **Negative Balance Test**:

   - Create an asset ledger (e.g., Cash)
   - Post a credit entry that makes balance negative
   - Generate exception report - should show NEGATIVE_BALANCE error

2. **Unbalanced Voucher Test**:

   - Create a voucher where debit total ≠ credit total (if possible)
   - Generate exception report - should show UNBALANCED_VOUCHER error

3. **Credit Limit Test**:
   - Set a credit limit on a ledger
   - Exceed the limit through transactions
   - Generate exception report - should show CREDIT_LIMIT_EXCEEDED error

## Phase 19: Auxiliary Bookkeeping Tools

### Step 63: Reversing Journals

1. **Create Original Voucher**:

   - Navigate to **Vouchers** (`/vouchers`)
   - Create any voucher (e.g., Payment, Receipt, Journal)
   - Note the voucher number

2. **Create Reversing Journal**:

   - Call the API endpoint: `POST /vouchers/:voucherId/reverse`
   - Provide optional reversal date and narration
   - **Expected**: A new reversing journal voucher is created with:
     - Opposite entry types (DEBIT becomes CREDIT, CREDIT becomes DEBIT)
     - Same ledger names and amounts
     - Narration indicating it's a reversal
     - REVERSING_JOURNAL voucher type

3. **Verify Reversal**:
   - Check that the original voucher entries are reversed
   - Verify the reversing journal appears in the vouchers list
   - Confirm ledger balances are adjusted correctly

## Phase 20: Budgeting Module

### Step 64: Budget Creation

1. Navigate to **Bookkeeping** (`/bookkeeping`)
2. Switch to the **Budgeting** tab
3. **Create Budget**:
   - Click "Create Budget" button
   - Fill in the form:
     - Budget Name (e.g., "Sales Budget 2024")
     - Description (optional)
     - Period Start and End dates
     - Budget Type (Ledger, Group, or Cost Centre)
     - Amount
   - Click "Create Budget"
4. **Verify Budget Created**:
   - Budget should appear in the budgets list
   - Budget shows type, period, and amount

### Step 65: Budget Variance Analytics

1. In the **Budgeting** tab, view the **Variance Analytics**:
   - Summary cards showing:
     - Total Budgeted
     - Total Actual
     - Total Variance (Actual - Budgeted)
     - Number of Breaches
2. **Verify Calculations**:
   - Actual spending is calculated from voucher entries
   - Variance is the difference between actual and budgeted
   - Variance percentage is calculated

### Step 66: Budget Breach Alerts

1. **View Breaches**:
   - The "Budget Breaches" section shows budgets that have exceeded limits
   - Each breach shows:
     - Budget name
     - Budgeted amount
     - Actual amount
     - Variance (difference)
     - Status (BREACH)
2. **Test Breach**:
   - Create a budget for a ledger
   - Create vouchers that exceed the budget
   - Generate breach report - should show the breach

## Phase 21: Year-End Operations

### Step 67: Generate Closing Entries

1. Navigate to **Bookkeeping** (`/bookkeeping`)
2. Switch to the **Year-End Operations** tab
3. **Generate Closing Entries**:
   - Enter Financial Year End date
   - Add optional narration
   - Click "Generate Closing Entries"
4. **Verify Closing Entries**:
   - A closing entry voucher is created
   - All income accounts are debited (closed)
   - All expense accounts are credited (closed)
   - Net profit/loss is transferred to Capital Account
   - Voucher should appear in vouchers list

### Step 68: Run Depreciation

1. In the **Year-End Operations** tab, go to **Depreciation Run** section
2. **Run Depreciation**:
   - Enter "As On Date"
   - Enter Depreciation Rate (default: 10%)
   - Add optional narration
   - Click "Run Depreciation"
3. **Verify Depreciation**:
   - Depreciation voucher is created
   - Asset accounts are credited (reduced)
   - Depreciation Expense account is debited
   - Amount calculated based on book value and rate
   - Voucher should appear in vouchers list

### Step 69: Carry Forward Balances

1. In the **Year-End Operations** tab, go to **Carry Forward Balances** section
2. **Carry Forward**:
   - Enter "From" date (Financial Year End)
   - Enter "To" date (New Financial Year Start)
   - Click "Carry Forward Balances"
3. **Verify Carry Forward**:
   - Closing balances from old year become opening balances for new year
   - All ledgers' opening balances are updated
   - Success message confirms the operation
   - Check ledger master to verify updated opening balances

**Happy Testing! 🚀**

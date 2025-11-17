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
   - Enable TallyVault: `Yes` (toggle ON)
   - Enable User Access Control: `Yes` (toggle ON)
   - Enable MFA: `No` (can enable later)
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
2. Enable all modules:
   - ✅ Accounting
   - ✅ Inventory
   - ✅ Taxation
   - ✅ Payroll
   - ✅ Banking
3. Save changes

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
7. **Verify**: The new voucher type appears in the list

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
4. **Verify**: Series appear under each voucher type with their details

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

## Phase 4: GST/Statutory Configuration

### Step 12: GST Registrations

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

### Step 13: GST Tax Rates

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

### Step 14: GST Ledger Mappings

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

## Phase 5: Voucher Entry & Bill-wise Tracking

### Step 15: Create Sales Voucher with Bill Reference

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

### Step 16: Create Purchase Voucher with Bill Reference

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

### Step 17: Create Payment Voucher (Bill Settlement)

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

### Step 18: Create Receipt Voucher (Bill Settlement)

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

## Phase 6: Bills Management

### Step 19: View Bills

1. Navigate to **Bills** (`/bills`)
2. View all bills:
   - Filter by Bill Type: Receivables / Payables
   - Filter by Status: Open / Partial / Settled
3. Verify bills created from vouchers are listed

### Step 20: Bill Aging Report

1. Stay in **Bills** page
2. Navigate to **Aging Report** section
3. View aging buckets:
   - Current (not overdue)
   - 1-30 days
   - 31-60 days
   - 61-90 days
   - Over 90 days
4. Verify bills are categorized correctly

### Step 21: Outstanding by Ledger

1. Stay in **Bills** page
2. Navigate to **Outstanding by Ledger** section
3. View party-wise outstanding:
   - Customer ABC: Outstanding amount
   - Supplier XYZ: Outstanding amount
4. Verify calculations are correct

### Step 22: Manual Bill Settlement

1. In **Bills** page, find an open bill
2. Click **Settle Bill**
3. Select voucher and entry for settlement
4. Enter settlement amount
5. Add remarks
6. Complete settlement
7. **Verify**: Bill status updated, outstanding reduced

---

## Phase 7: Cost Management - Interest Assignment

### Step 23: Assign Interest to Parties

1. Navigate to **Cost Management** (`/cost-management`)
2. Go to **Party Interest** tab (click on "Party Interest" tab)
3. Click **Assign Interest** button
4. Assign interest profiles:
   - Select Interest Profile: "Standard Receivables" (from dropdown)
   - Enter Party Name: "Customer ABC" (or select from existing parties)
   - Override Rate: (optional, leave blank to use profile rate)
   - Effective From: Today's date
5. Click **Assign** button to save
6. **Verify**: The assignment appears in the Party Interest table
7. Repeat for other parties if needed

---

## Phase 8: Tally Import/Export

### Step 24: Download Tally Import Template

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

### Step 25: Import Tally Data

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

## Phase 9: Audit Log / Edit Trail

### Step 26: View Audit Logs

1. Navigate to **Audit Log** (`/audit-log`)
2. View summary cards:
   - Total logs
   - Logs by action (CREATE, UPDATE, DELETE)
   - Logs by entity type
3. View recent activity list

### Step 27: Filter Audit Logs

1. Stay in **Audit Log** page
2. Apply filters:
   - Entity Type: "VOUCHER"
   - Action: "CREATE"
   - Date Range: Last 7 days
   - User: (select specific user)
3. Verify filtered results

### Step 28: View Entity Audit Trail

1. In **Audit Log** page
2. Click on a specific log entry
3. View details:
   - Old values vs New values
   - User who made change
   - Timestamp
   - IP address (if available)
4. Verify all changes are logged

### Step 29: Test Edit Log Toggle

1. Go to **Settings** → **Financial** tab → **Financial Year & Edit Log**
2. Toggle **Enable Edit Log** to `OFF`
3. Make a change (e.g., update a voucher)
4. Go back to **Audit Log**
5. **Verify**: Non-critical actions are not logged (only DELETE, APPROVE, REJECT should be logged)
6. Toggle Edit Log back `ON`

---

## Phase 10: Role Management

### Step 30: View Roles

1. Navigate to **Role Management** (`/role-management`)
2. **Roles Tab**:
   - View existing roles (Admin, Accountant, etc.)
   - See permission count per role
   - See user count per role

### Step 31: Create Custom Role

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

### Step 32: Manage Permissions

1. Go to **Permissions Tab**
2. View all available permissions
3. Create custom permission (if needed):
   - Action: "export"
   - Subject: "reports"
   - Description: "Export financial reports"
4. Save permission

### Step 33: Assign Roles to Users

1. Go to **User Assignments Tab**
2. View all users with their roles
3. Assign role to user:
   - Select a user
   - Click **Assign Role**
   - Select "Finance Manager" role
   - Save
4. **Verify**: User now has the assigned role

### Step 34: Update Role Permissions

1. Go back to **Roles Tab**
2. Edit "Finance Manager" role
3. Add/remove permissions
4. Save changes
5. **Verify**: User's access is updated

---

## Phase 11: AI Workflows with Voucher Data

### Step 35: AI Chatbot Interaction

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

### Step 36: AI Scenarios Analysis

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

### Step 37: AI-Powered Insights

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

### Step 38: AI Forecasting

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

## Phase 12: Final Verification

### Step 39: Dashboard Verification

1. Navigate to **Dashboard** (`/dashboard`)
2. Verify:
   - AI insights are displayed
   - Recent activity shows vouchers created
   - Cashflow chart (if applicable)
   - Summary metrics

### Step 40: Data Consistency Check

1. Cross-verify data across modules:
   - **Vouchers**: Check voucher totals
   - **Bills**: Check outstanding amounts match voucher entries
   - **GST**: Verify tax calculations
   - **Cost Management**: Verify cost center assignments
   - **Audit Log**: Verify all changes are logged
2. Check for any inconsistencies

### Step 41: Tally Import Round-trip

1. Export data from Tally (if you have Tally setup)
2. Import the exported file using **Import from Tally** (`/tally-import`)
3. **Verify**:
   - All vouchers are imported correctly
   - Ledgers and parties are created
   - Bill references are maintained
   - GST data is imported if present

### Step 42: Role-Based Access Test

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

**Happy Testing! 🚀**

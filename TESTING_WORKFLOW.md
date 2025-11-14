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
1. Navigate to **Vouchers** (`/vouchers`)
2. Go to **Voucher Types** section/tab
3. Review default voucher types (Payment, Receipt, Sales, Purchase, Journal, Contra)
4. Create a custom voucher type:
   - Name: "Credit Note"
   - Category: "Sales"
   - Prefix: "CN"
   - Numbering Method: "Automatic"
5. Save

### Step 8: Configure Numbering Series
1. Stay in **Vouchers** → **Numbering Series** section
2. For each voucher type, set up numbering:
   - Select "Payment" voucher type
   - Create series: Prefix "PAY", Start Number: 1, Format: "PAY-{NUMBER}"
   - Repeat for Receipt, Sales, Purchase
3. Save all series

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
1. Stay in **Cost Management** → **Interest Settings Tab**
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
1. Stay in **GST** → **Tax Rates Tab**
2. Create tax rates:
   - Name: "GST 18%"
     - Type: "GST"
     - CGST: 9%
     - SGST: 9%
     - IGST: 18%
   - Name: "GST 5%"
     - Type: "GST"
     - CGST: 2.5%
     - SGST: 2.5%
     - IGST: 5%
   - Name: "GST 0%"
     - Type: "GST"
     - CGST: 0%
     - SGST: 0%
     - IGST: 0%

### Step 14: GST Ledger Mappings
1. Stay in **GST** → **Ledger Mappings Tab**
2. Create mappings:
   - Ledger Name: "Sales Account"
     - Category: "Output Tax"
     - Tax Rate: "GST 18%"
   - Ledger Name: "Purchase Account"
     - Category: "Input Tax"
     - Tax Rate: "GST 18%"
   - Ledger Name: "CGST Payable"
     - Category: "CGST"
   - Ledger Name: "SGST Payable"
     - Category: "SGST"

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
2. Go to **Interest Settings** → **Party Assignments**
3. Assign interest profiles:
   - Select "Customer ABC"
   - Interest Profile: "Standard Receivables"
   - Apply on Receivables: Yes
   - Effective From: Today
4. Save assignment
5. Repeat for other parties if needed

---

## Phase 8: Tally Import/Export

### Step 24: Export Data to Excel
1. Navigate to **Import from Tally** (`/tally-import`)
2. **Export Section**:
   - Export Vouchers: Click "Export Vouchers"
     - Verify Excel file downloads
     - Open file and verify structure
   - Export Ledgers: Click "Export Ledgers"
   - Export GST Data: Click "Export GST Data"
3. **Template Download**:
   - Download Tally Import Template
   - Verify template structure

### Step 25: Import Enhanced Tally Data
1. Stay in **Import from Tally** page
2. **Enhanced Import**:
   - Prepare sample data (or use template):
     - Multi-series vouchers
     - GST data
     - Proper voucher types
   - Upload XML or Excel file
   - Verify import completes successfully
   - Check that vouchers are created with correct types and series

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

### Step 35: Voucher Anomaly Detection
1. Create some test vouchers with unusual patterns:
   - Very large amount voucher (e.g., 1,000,000)
   - Duplicate voucher numbers
   - Voucher with missing data
2. Navigate to **Smart Alerts** (`/alerts`)
3. View **Voucher Anomalies**:
   - Check for alerts about large transactions
   - Check for duplicate detection
   - Check for incomplete data warnings
4. Review recommendations

### Step 36: Variance Analysis
1. Navigate to **AI Assistant** or relevant AI page
2. Access **Voucher Variance Analysis**:
   - Select period: Monthly / Quarterly / Yearly
   - View actual vs expected patterns
   - Review variance percentages
3. Verify analysis uses real voucher data

### Step 37: AI-Powered Insights
1. Stay in AI section
2. Access **Voucher Insights**:
   - View summary of trends
   - Review insights
   - Check recommendations
3. Verify insights are based on actual vouchers created

### Step 38: Enhanced Scenario Analysis
1. Navigate to **Scenarios** or **AI Assistant**
2. Run a "What If" scenario:
   - Scenario: "Increase revenue by 20%"
   - Review analysis
3. **Verify**: Scenario uses recent voucher data for calculations
4. Check that voucher statistics are included in analysis

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

### Step 41: Export & Import Round-trip
1. Export all data (Vouchers, Ledgers, GST)
2. Clear some test data
3. Re-import the exported data
4. **Verify**: Data is restored correctly

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
- [x] Voucher types configuration
- [x] Numbering series setup
- [x] Create vouchers (Sales, Purchase, Payment, Receipt)
- [x] Bill-wise references in vouchers

✅ **Bill Management**
- [x] Bills created from vouchers
- [x] Bill settlement
- [x] Aging reports
- [x] Outstanding by ledger

✅ **Cost Management**
- [x] Cost categories (hierarchical)
- [x] Cost centers (hierarchical)
- [x] Interest profiles
- [x] Party interest assignments

✅ **GST Configuration**
- [x] GST registrations
- [x] Tax rates
- [x] Ledger mappings

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

✅ **Tally Import/Export**
- [x] Export to Excel
- [x] Enhanced import
- [x] Template download

✅ **AI Workflows**
- [x] Voucher anomaly detection
- [x] Variance analysis
- [x] AI insights
- [x] Enhanced scenario analysis

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


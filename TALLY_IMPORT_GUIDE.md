# Tally to Coxist AI - Data Import Guide

## Overview

The Tally Import feature allows you to seamlessly migrate your financial records from Tally ERP to Coxist AI. All your ledgers, parties, transactions, and opening balances will be imported and automatically reflected in your financial dashboard.

## What Gets Imported? 📊

### 1. **Ledgers/Accounts**
- Account names and groups
- Opening balances (Debit/Credit)
- Account types (Cash, Bank, Receivables, Payables, etc.)
- All ledger master data

### 2. **Parties (Debtors & Creditors)**
- Customer names and contact information
- Supplier details
- Opening balances
- Balance types (Debit/Credit)

### 3. **Transactions**
- All journal entries
- Sales invoices and purchases
- Payment and receipt vouchers
- Contra entries
- Transaction dates, amounts, and narrations
- Complete debit-credit information

### 4. **Financial Data**
- Period-wise records
- Complete transaction history
- Ledger balances
- Party balances

## How to Import Your Tally Data 🚀

### Step 1: Export Data from Tally

1. **Open Tally** → Go to Reports
2. **Select "Ledgers"** or **"Party Ledgers"** based on what you want to export
3. **Choose the period** you want to export (e.g., full year, specific month)
4. **Click on "Export"** option
5. **Select "Excel Format"** (.xlsx or .csv)
6. **Save the file** to your computer

### Step 2: Access Coxist AI Import

1. **Log in** to your Coxist AI account
2. **Click "Import from Tally"** in the left sidebar
3. You'll see the import page with upload options

### Step 3: Upload Your File

#### Option A: Drag and Drop
- Drag your exported Tally Excel file directly onto the upload area
- The file will be processed automatically

#### Option B: Browse File
- Click the **"Select File"** button
- Choose your Tally Excel export from your computer
- Click Open

### Step 4: Review Import Data

After uploading, you'll see:
- **Summary Statistics**: Total ledgers, parties, transactions, and amounts
- **Warnings**: Any data quality issues found
- **Ledger Preview**: All accounts being imported with opening balances
- **Party Preview**: All customers/suppliers with opening balances

**Important**: If there are errors, fix them before proceeding.

### Step 5: Confirm and Import

1. Review all the data in the preview
2. Click **"Confirm & Import"** button
3. Wait for the import to complete (shows progress bar)
4. You'll see a success message when done

### Step 6: View Your Data

- Click **"View Dashboard"** to see your imported data
- Your financial dashboard will now show:
  - All ledgers with opening balances
  - Transaction history
  - Cash flow analysis
  - Party balances

## Excel File Format 📋

Your Tally export should have the following structure:

### Sheet 1: "Ledger"
| Ledger Name | Group Name | Opening Balance | Balance Type |
|---|---|---|---|
| Cash | Cash & Bank | 500000 | Debit |
| Bank Account | Cash & Bank | 1000000 | Debit |

### Sheet 2: "Party Ledger" or "Parties"
| Party Name | Type | Opening Balance | Balance Type | Email | Mobile |
|---|---|---|---|---|---|
| ABC Corporation | Customer | 50000 | Debit | contact@abc.com | 9876543210 |
| XYZ Suppliers | Supplier | 75000 | Credit | sales@xyz.com | 9123456789 |

### Sheet 3: "Transactions"
| Date | Voucher No | Voucher Type | Ledger Name | Debit | Credit | Narration |
|---|---|---|---|---|---|---|
| 2024-01-01 | JNL001 | Journal | Cash | 50000 | 0 | Opening balance |
| 2024-01-05 | INV001 | Sales | Cash | 0 | 25000 | Sales to XYZ |

## Supported Data

### Ledger Groups
- Cash & Bank
- Current Assets
- Fixed Assets
- Receivables (Debtors)
- Payables (Creditors)
- Current Liabilities
- Long-term Liabilities
- Capital/Equity
- Reserves
- Revenue
- Expenses

### Voucher Types
- Sales
- Purchase
- Journal
- Receipt
- Payment
- Contra

### Party Types
- Customer (Debtors)
- Supplier (Creditors)
- Employee
- Other

## Data Validation 🔍

Coxist AI validates your data to ensure accuracy:

1. **Debit-Credit Balance**: Ensures total debits = total credits
2. **Duplicate Detection**: Identifies duplicate ledgers or parties
3. **Data Completeness**: Checks for missing required fields
4. **Date Validation**: Ensures all dates are in valid format
5. **Amount Validation**: Verifies all amounts are numeric

### What Happens If Validation Fails?

- **Errors** (Red): Import cannot proceed. Fix these before importing.
- **Warnings** (Amber): Import can proceed, but review these items. They might affect your financial reports.

## Features After Import ✨

Once your data is imported:

### Financial Dashboard
- See all your ledgers with balances
- View transaction history
- Track cash flow by account

### AI-Powered Analysis
- Automatic anomaly detection
- Burn rate calculations
- Runway projections
- Revenue forecasting

### Compliance Hub
- Tax compliance tracking
- Expense management
- Receipt processing
- Bookkeeping records

### Smart Alerts
- Financial health monitoring
- Low cash warnings
- High burn rate alerts
- Revenue anomalies

## FAQ ❓

### Can I import multiple files?
Yes! You can import multiple Tally exports. They will all be consolidated into your financial records. **Note**: Duplicate ledger names will not be created; the system will merge them.

### Will importing affect my existing data?
- If you have existing data in Coxist AI, imported data will be **added** to it.
- Duplicate ledgers won't be created twice.
- Opening balances will be preserved from your Tally export.

### What if my Tally file has a different format?
The import tool is flexible and recognizes various column names:
- "Ledger Name" or "Account Name" or "Account"
- "Opening Balance" or "Opening Bal"
- "Group Name" or "Group" or "Account Group"
- "Narration" or "Description"
- And many more variations...

### Can I import just ledgers or just parties?
Yes! You can export only what you need from Tally:
- Export only Ledgers if you don't need party information
- Export only Party Ledgers if you just want customer/supplier data
- The system will import whatever you provide

### What currency is supported?
Currently, Coxist AI uses **Indian Rupees (₹)** by default. Make sure your Tally export is in the same currency.

### How long does import take?
- Typical import time: 10-30 seconds depending on file size
- Large files (10,000+ transactions) may take 1-2 minutes
- Progress bar shows real-time status

### Can I import historical data?
Yes! You can import transactions from any period. The system will:
- Preserve transaction dates
- Maintain historical balances
- Allow you to analyze trends over time

### What if I made a mistake in the import?
You can:
1. **Import Again**: Import the corrected file
2. **Manual Cleanup**: Edit individual records in the dashboard
3. **Contact Support**: Our team can help with data issues

## Sample Template 📥

We provide a sample import template showing the expected format. Download it from:
- Click **"Download Sample Template"** on the import page
- Edit it with your data
- Upload the edited file

## Troubleshooting 🔧

### "File format not supported"
- Ensure you're uploading .xlsx, .xls, or .csv files
- Re-export from Tally in Excel format

### "No ledgers or parties found"
- Check that your Tally export includes at least one ledger or party
- Verify column headers match expected format
- Ensure data rows are below the header row

### "Debit-Credit mismatch warning"
- This is usually normal with opening balances
- Review the amounts in the warning message
- You can proceed with import, but note the mismatch

### Missing data after import
- Check if the data was marked with a warning during import
- Some data might have been skipped due to validation errors
- Re-export from Tally with all required fields

## Best Practices ✅

1. **Export Complete Data**: Always include all periods of data you want to track
2. **Check Column Headers**: Ensure your Tally export has standard column names
3. **Validate Before Import**: Review the preview carefully before confirming
4. **Keep Backup**: Always keep your original Tally backup file
5. **One Startup = One Import**: Each Coxist AI account handles one company
6. **Regular Syncs**: Update your import periodically with new transactions

## Need Help? 💬

If you encounter issues during import:
1. Check this guide first
2. Review the warning/error messages provided
3. Download the sample template and compare formats
4. Contact our support team for assistance

---

**Happy Importing! Your Tally data is now part of Coxist AI's AI-powered financial management system.** 🎉

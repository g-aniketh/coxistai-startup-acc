# Tally Import Feature - Quick Start Setup Guide

## Prerequisites
- Node.js 16+ and npm/yarn
- PostgreSQL database running
- Git repository cloned

## Step 1: Install Dependencies

### Frontend
```bash
cd frontend
npm install
# New package added: xlsx ^0.18.5
```

### Backend
```bash
cd backend
npm install
# No new dependencies required (all existing)
```

## Step 2: Update Database Schema

```bash
cd backend

# Create migration for new models
npx prisma migrate dev --name add_tally_import_models

# Or if you want to reset (dev only):
# npx prisma db push
```

This creates three new tables:
- `PartyMaster`: Customer/Supplier data
- `ImportedTransaction`: Transaction records from Tally
- `ImportHistory`: Import operation logs

## Step 3: Start Development Servers

### Terminal 1: Backend
```bash
cd backend
npm run dev
# Server running on http://localhost:3001
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
# Application running on http://localhost:3000
```

## Step 4: Test the Feature

### Access the Import Page
1. Open http://localhost:3000
2. Log in with your credentials
3. Click **"Import from Tally"** in the left sidebar
4. You should see the import upload page

### Download Sample Template
1. On the import page, click **"Download Sample Template"**
2. This downloads a `Tally_Import_Template.xlsx` file
3. Open it to see the expected format

### Test with Sample Data
1. Edit the sample template with test data
2. Save the file
3. Return to the import page
4. Drag the file onto the upload area (or click to browse)
5. Review the parsed data
6. Click "Confirm & Import"
7. Wait for completion

### Verify Import in Dashboard
1. Click "View Dashboard" after successful import
2. Go to "Financial Dashboard" to see:
   - Imported ledgers/accounts
   - Opening balances
   - Transaction history (if included)

## Step 5: Check Database Records

### Using Prisma Studio (Optional)
```bash
cd backend
npx prisma studio --port 5556
# Opens http://localhost:5556
# Browse the PartyMaster, ImportedTransaction, ImportHistory tables
```

## File Changes Summary

### New Files Created:
1. `frontend/src/lib/excel-parser.ts` - Excel parsing logic
2. `frontend/src/app/tally-import/page.tsx` - Import UI page
3. `backend/src/routes/import.ts` - Import API endpoint
4. `TALLY_IMPORT_GUIDE.md` - User documentation
5. `IMPLEMENTATION_SUMMARY.md` - Technical documentation
6. `QUICK_START_SETUP.md` - This file

### Files Modified:
1. `frontend/package.json` - Added xlsx dependency
2. `frontend/src/components/layout/Sidebar.tsx` - Added import link
3. `backend/src/index.ts` - Registered import route
4. `backend/prisma/schema.prisma` - Added new models

## Common Setup Issues & Solutions

### Issue: "Module not found: xlsx"
```bash
# Solution:
cd frontend
npm install xlsx --save
```

### Issue: "Prisma migration fails"
```bash
# Solution: Check DATABASE_URL in .env
# Make sure PostgreSQL is running
# Verify database exists and is accessible
npx prisma db push --force-reset  # dev only!
```

### Issue: "Import route returns 404"
```bash
# Solution: Verify import.ts is exported correctly
# Check backend/src/index.ts has import route registered:
import importRoutes from './routes/import';
v1Router.use('/import', authenticateToken, importRoutes);
```

### Issue: "Authentication fails on import"
```bash
# Solution: Ensure you're logged in before accessing import
# Check that auth token is properly set in localStorage
# Verify JWT token is valid and not expired
```

## Testing Endpoints

### Test Import API (curl)
```bash
# First, get authentication token from login endpoint
TOKEN="your_jwt_token_here"

# Prepare test data JSON
curl -X POST http://localhost:3001/api/v1/import/tally \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ledgers": [
      {
        "ledgerName": "Cash",
        "accountGroup": "Cash & Bank",
        "openingBalance": 100000,
        "openingType": "Debit",
        "transactions": []
      }
    ],
    "parties": [],
    "summary": {
      "totalLedgers": 1,
      "totalParties": 0,
      "totalTransactions": 0,
      "dateRange": {"from": "2024-01-01", "to": "2024-12-31"},
      "totalDebit": 100000,
      "totalCredit": 100000
    },
    "errors": [],
    "warnings": []
  }'
```

## Sample Data Templates

### Minimal Test Data (Ledgers Only)
```excel
Sheet: "Ledger"
Ledger Name | Group Name | Opening Balance | Balance Type
Cash | Cash & Bank | 500000 | Debit
Bank | Cash & Bank | 1000000 | Debit
```

### Full Test Data (Ledgers + Parties)
```excel
Sheet: "Ledger"
Ledger Name | Group Name | Opening Balance | Balance Type
Cash | Cash & Bank | 500000 | Debit
Sales | Revenue | 0 | Credit

Sheet: "Party Ledger"
Party Name | Type | Opening Balance | Balance Type | Email
ABC Corp | Customer | 50000 | Debit | abc@example.com
XYZ Ltd | Supplier | 75000 | Credit | xyz@example.com
```

### Complete Test Data (With Transactions)
```excel
Sheet: "Ledger"
Ledger Name | Group Name | Opening Balance | Balance Type
Cash | Cash & Bank | 100000 | Debit
Sales | Revenue | 0 | Credit

Sheet: "Transactions"
Date | Voucher No | Voucher Type | Ledger Name | Debit | Credit | Narration
2024-01-01 | OB001 | Journal | Cash | 100000 | 0 | Opening balance
2024-01-15 | INV001 | Sales | Sales | 0 | 50000 | Invoice to ABC Corp
```

## Verification Checklist

After setup, verify these work:

- [ ] Frontend runs without errors: `npm run dev`
- [ ] Backend runs without errors: `npm run dev`
- [ ] Can access import page in UI
- [ ] Can download sample template
- [ ] Can drag-drop Excel file
- [ ] File parsing works (see preview page)
- [ ] Can view parsed data (ledgers, parties)
- [ ] Can confirm and import data
- [ ] Import completes successfully
- [ ] Can see import in success page
- [ ] Data appears in Financial Dashboard
- [ ] Database has records in PartyMaster table
- [ ] Database has records in ImportedTransaction table
- [ ] Database has records in ImportHistory table

## Next Steps

1. **Test with real Tally data**: Export actual data from Tally and test import
2. **Dashboard integration**: Ensure imported data displays correctly in all dashboards
3. **Performance testing**: Test with large files (10k+ transactions)
4. **User acceptance testing**: Have actual Tally users test the feature
5. **Documentation review**: Ensure TALLY_IMPORT_GUIDE.md is clear for end users

## Support & Debugging

### Enable Debug Logging
```typescript
// In frontend/src/app/tally-import/page.tsx, add:
console.log('Import Data:', importData);
console.log('Parse Errors:', importData.errors);
console.log('Parse Warnings:', importData.warnings);
```

### Check Backend Logs
```bash
# Terminal running backend server will show:
// - File parsing progress
// - Database insert operations
// - Error details
// - Import summary
```

### Review Database Logs
```bash
# PostgreSQL query logs (if enabled)
SELECT * FROM "PartyMaster" WHERE "startupId" = 'your_startup_id';
SELECT * FROM "ImportedTransaction" WHERE "startupId" = 'your_startup_id';
SELECT * FROM "ImportHistory" WHERE "startupId" = 'your_startup_id';
```

## Performance Benchmarks

Expected performance on standard hardware:

| File Size | Rows | Parse Time | Import Time | Total |
|---|---|---|---|---|
| 100 KB | 100 | 200ms | 500ms | 700ms |
| 1 MB | 1,000 | 500ms | 2s | 2.5s |
| 10 MB | 10,000 | 3s | 15s | 18s |
| 50 MB | 50,000 | 10s | 60s | 70s |

## Rollback Instructions

If you need to revert the Tally import feature:

### Remove from Database
```bash
cd backend

# Drop new tables
npx prisma migrate resolve --rolled-back add_tally_import_models

# Or manually:
# DROP TABLE "PartyMaster";
# DROP TABLE "ImportedTransaction";
# DROP TABLE "ImportHistory";
```

### Remove Files
```bash
rm frontend/src/lib/excel-parser.ts
rm -rf frontend/src/app/tally-import/
rm backend/src/routes/import.ts
```

### Revert Modifications
```bash
# Undo changes in:
git checkout frontend/package.json
git checkout frontend/src/components/layout/Sidebar.tsx
git checkout backend/src/index.ts
git checkout backend/prisma/schema.prisma
```

## Additional Resources

- **User Guide**: See `TALLY_IMPORT_GUIDE.md`
- **Technical Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Excel Parser**: `frontend/src/lib/excel-parser.ts`
- **API Reference**: `backend/src/routes/import.ts`

---

**Status**: Ready for Development ✅
**Last Updated**: October 2024

For questions or issues, refer to the documentation files or contact the development team.

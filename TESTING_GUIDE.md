# Testing Guide - Voucher System & Accounting Features

This guide will help you test all the new voucher system features, inventory management, GST integration, and related accounting functionality.

## Prerequisites

1. **Database Setup**: Ensure you've run `npx prisma db push` and `npm run db:seed` (or `pnpm db:seed`)
2. **Backend Running**: Start the backend server (`npm run dev` in `backend/` directory)
3. **Frontend Running**: Start the frontend server (`npm run dev` in `frontend/` directory)
4. **Login**: Use `demo@coxistai.com` / `password123` for testing

---

## Part 1: Basic Setup Verification

### 1.1 Verify Seed Data

1. **Login** to the application
2. Navigate to **Vouchers** page (`/vouchers`)
3. Check that you see:
   - Quick action buttons for Payment, Receipt, Contra, Journal, Sales, Purchase
   - List of voucher types available

4. Navigate to **Products/Items** page (if available) or check via API
5. Verify you see 5 items:
   - Premium SaaS License
   - API Credits - 10K
   - Consulting Hours - 5hr Pack
   - Cloud Server - Monthly
   - Office Supplies

6. Navigate to **Warehouses** (if available) or check via API
7. Verify you see 3 warehouses:
   - Main Warehouse
   - Secondary Warehouse
   - Storage Unit

8. Navigate to **Ledgers** or check via API
9. Verify you see ledgers with proper subtypes:
   - Cash (CASH)
   - HDFC Bank - Current Account (BANK)
   - ABC Corporation (CUSTOMER)
   - XYZ Tech Solutions (CUSTOMER)
   - Cloud Services Provider (SUPPLIER)
   - Office Supplies Vendor (SUPPLIER)
   - Sales (SALES)
   - Purchases (PURCHASE)
   - GST Output CGST, SGST, IGST
   - GST Input CGST, SGST, IGST

---

## Part 2: Testing Payment Voucher

### Test 2.1: Create Payment Voucher

1. Navigate to `/vouchers/payment`
2. Fill in the form:
   - **Paid From**: Select "Cash" or "HDFC Bank - Current Account"
   - **Paid To**: Select "Cloud Services Provider" (supplier)
   - **Amount**: `50000`
   - **Payment Mode**: Select "BANK_TRANSFER"
   - **Reference**: `REF-001`
   - **Date**: Today's date
   - **Narration**: `Payment for cloud services`

3. Click **Create & Post**
4. **Expected Result**:
   - Success message: "Payment voucher created and posted successfully"
   - Redirected to `/vouchers`
   - Voucher appears in the list with status "Posted"
   - Voucher number starts with "PMT/"

### Test 2.2: Verify Ledger Entries

1. Navigate to **Ledgers** or **Trial Balance** report
2. Check **Cloud Services Provider** ledger:
   - Should show debit balance of ₹50,000
3. Check **Cash** or **Bank** ledger:
   - Should show credit balance (reduced by ₹50,000)

### Test 2.3: Verify Voucher Details

1. Click on the created payment voucher
2. Verify:
   - Status is "POSTED"
   - Two ledger entries exist (DR: Supplier, CR: Cash/Bank)
   - Total amount is ₹50,000
   - Entries are balanced

---

## Part 3: Testing Receipt Voucher

### Test 3.1: Create Receipt Voucher

1. Navigate to `/vouchers/receipt`
2. Fill in the form:
   - **Received Into**: Select "Cash" or "HDFC Bank - Current Account"
   - **Received From**: Select "ABC Corporation" (customer)
   - **Amount**: `100000`
   - **Payment Mode**: Select "CHEQUE"
   - **Reference**: `CHQ-001`
   - **Date**: Today's date
   - **Narration**: `Receipt from customer`

3. Click **Create & Post**
4. **Expected Result**:
   - Success message
   - Voucher appears with status "Posted"
   - Voucher number starts with "RCT/"

### Test 3.2: Verify Ledger Entries

1. Check **ABC Corporation** ledger:
   - Should show credit balance (reduced outstanding)
2. Check **Cash** or **Bank** ledger:
   - Should show debit balance (increased by ₹1,00,000)

---

## Part 4: Testing Contra Voucher

### Test 4.1: Create Contra Voucher

1. Navigate to `/vouchers/contra`
2. Fill in the form:
   - **Source Ledger**: Select "Cash"
   - **Destination Ledger**: Select "HDFC Bank - Current Account"
   - **Amount**: `25000`
   - **Date**: Today's date
   - **Narration**: `Cash deposit to bank`

3. Click **Create & Post**
4. **Expected Result**:
   - Success message
   - Voucher number starts with "CTR/"
   - Status is "Posted"

### Test 4.2: Verify Ledger Entries

1. Check **Cash** ledger:
   - Balance decreased by ₹25,000
2. Check **HDFC Bank** ledger:
   - Balance increased by ₹25,000

---

## Part 5: Testing Journal Voucher

### Test 5.1: Create Journal Voucher

1. Navigate to `/vouchers/journal`
2. Add entries:
   - **Entry 1**:
     - Ledger: "Sales"
     - Debit: `50000`
     - Credit: (leave empty)
   - **Entry 2**:
     - Ledger: "Purchases"
     - Debit: (leave empty)
     - Credit: `50000`

3. Verify totals show "Balanced"
4. Click **Create & Post**
5. **Expected Result**:
   - Success message
   - Voucher number starts with "JRN/"
   - Status is "Posted"

### Test 5.2: Test Unbalanced Journal

1. Try creating a journal with:
   - Entry 1: Debit ₹50,000
   - Entry 2: Credit ₹40,000
2. **Expected Result**:
   - Error message: "Voucher is not balanced"
   - Cannot submit

---

## Part 6: Testing Sales Voucher (With Inventory & GST)

### Test 6.1: Create Sales Voucher

1. Navigate to `/vouchers/sales`
2. Fill in the form:
   - **Customer**: Select "ABC Corporation"
   - **Invoice Date**: Today's date
   - **Place of Supply**: `29` (Karnataka state code)
   - **Customer GSTIN**: `29AABCU9603R1ZX` (optional)
   - **Reference**: `INV-001`

3. Add Item Lines:
   - **Item 1**:
     - Item: "Premium SaaS License"
     - Warehouse: "Main Warehouse"
     - Quantity: `2`
     - Rate: `24999` (auto-filled)
     - Discount: `0`
     - GST %: `18` (auto-filled)
   - **Item 2**:
     - Item: "API Credits - 10K"
     - Warehouse: "Main Warehouse"
     - Quantity: `5`
     - Rate: `4199` (auto-filled)
     - Discount: `500`
     - GST %: `18`

4. Verify totals:
   - Items Subtotal: ₹69,995 (2×24,999 + 5×4,199 - 500)
   - Total Tax: ₹12,599.10 (18% of subtotal)
   - Grand Total: ₹82,594.10

5. Click **Create & Post**
6. **Expected Result**:
   - Success message
   - Voucher number starts with "SAL/"
   - Status is "Posted"

### Test 6.2: Verify Sales Voucher Posting

1. Check **ABC Corporation** ledger:
   - Debit balance of ₹82,594.10 (grand total)
2. Check **Sales** ledger:
   - Credit balance of ₹69,995 (net amount)
3. Check **GST Output CGST** ledger:
   - Credit balance of ₹6,299.55 (half of GST)
4. Check **GST Output SGST** ledger:
   - Credit balance of ₹6,299.55 (half of GST)
5. Check **GST Output IGST** ledger:
   - Should be ₹0 (same state = CGST+SGST, not IGST)

### Test 6.3: Verify Inventory Stock

1. Navigate to inventory/stock report or check via API
2. Verify stock decreased:
   - Premium SaaS License: -2 units
   - API Credits - 10K: -5 units

### Test 6.4: Test Inter-State Sales (IGST)

1. Create another sales voucher:
   - Customer: "XYZ Tech Solutions"
   - Place of Supply: `09` (UP state code - different from company state)
   - Same items as above
2. **Expected Result**:
   - GST Output IGST ledger shows tax (not CGST/SGST)
   - IGST = 18% of subtotal

---

## Part 7: Testing Purchase Voucher (With Inventory & GST)

### Test 7.1: Create Purchase Voucher

1. Navigate to `/vouchers/purchase`
2. Fill in the form:
   - **Supplier**: Select "Cloud Services Provider"
   - **Invoice Date**: Today's date
   - **Place of Supply**: `29` (Karnataka)
   - **Supplier GSTIN**: (optional)
   - **Reference**: `PO-001`

3. Add Item Lines:
   - **Item 1**:
     - Item: "Cloud Server - Monthly"
     - Warehouse: "Main Warehouse"
     - Quantity: `3`
     - Rate: `8000` (auto-filled from default purchase rate)
     - Discount: `0`
     - GST %: `18`

4. Verify totals:
   - Items Subtotal: ₹24,000
   - Total Tax: ₹4,320
   - Grand Total: ₹28,320

5. Click **Create & Post**
6. **Expected Result**:
   - Success message
   - Voucher number starts with "PUR/"
   - Status is "Posted"

### Test 7.2: Verify Purchase Voucher Posting

1. Check **Cloud Services Provider** ledger:
   - Credit balance of ₹28,320 (grand total - payable)
2. Check **Purchases** ledger:
   - Debit balance of ₹24,000 (net amount)
3. Check **GST Input CGST** ledger:
   - Debit balance of ₹2,160 (input credit)
4. Check **GST Input SGST** ledger:
   - Debit balance of ₹2,160 (input credit)

### Test 7.3: Verify Inventory Stock

1. Check stock increased:
   - Cloud Server - Monthly: +3 units

---

## Part 8: Testing Draft & Post Workflow

### Test 8.1: Create Draft Voucher

1. Navigate to `/vouchers` (main page)
2. Use the manual entry form:
   - Select "Payment" voucher type
   - Add entries manually
   - Click "Create Voucher" (without autoPost)
3. **Expected Result**:
   - Voucher created with status "DRAFT"
   - Appears in list with "Draft" badge

### Test 8.2: Post Draft Voucher

1. Find the draft voucher in the list
2. Click **Post** button
3. **Expected Result**:
   - Status changes to "POSTED"
   - Ledger balances updated
   - Post button disappears

### Test 8.3: Cancel Posted Voucher

1. Navigate to a posted voucher
2. Click **Cancel** (if available)
3. **Expected Result**:
   - Status changes to "CANCELLED"
   - Ledger entries reversed (if implemented)

---

## Part 9: Testing Inventory Features

### Test 9.1: Check Stock Balance

1. Navigate to inventory/items page
2. View stock balance for each item
3. Verify:
   - Stock calculated from all vouchers
   - Shows current balance per warehouse

### Test 9.2: Test Stock Validation

1. Try creating a sales voucher with quantity > available stock
2. **Expected Result**:
   - Error message: "Insufficient stock"
   - Voucher cannot be posted

---

## Part 10: Testing GST Features

### Test 10.1: Verify GST Calculation

1. Create sales voucher with different GST rates:
   - Item with 18% GST
   - Item with 12% GST
   - Item with 5% GST
2. **Expected Result**:
   - GST calculated correctly for each item
   - Total GST = sum of all item GST

### Test 10.2: Verify GST Ledger Posting

1. After creating sales/purchase vouchers
2. Check GST ledgers:
   - Output GST (for sales) → Credit
   - Input GST (for purchase) → Debit
   - Correct CGST/SGST/IGST based on place of supply

---

## Part 11: Testing Financial Reports

### Test 11.1: Trial Balance

1. Navigate to **Trial Balance** report
2. Verify:
   - All ledger balances shown
   - Debit and Credit columns
   - Total Debit = Total Credit

### Test 11.2: Ledger Statement

1. Navigate to **Ledger Statement** for a specific ledger
2. Verify:
   - All voucher entries listed
   - Opening balance
   - Running balance
   - Closing balance

### Test 11.3: Day Book

1. Navigate to **Day Book** report
2. Verify:
   - All vouchers for selected date
   - Grouped by voucher type
   - Shows all entries

---

## Part 12: Testing Edge Cases

### Test 12.1: Zero Amount Voucher

1. Try creating a voucher with ₹0 amount
2. **Expected Result**:
   - Error: "Amount must be greater than zero"

### Test 12.2: Missing Required Fields

1. Try creating sales voucher without customer
2. **Expected Result**:
   - Error: "Please select a customer"

### Test 12.3: Invalid GST Rate

1. Try entering GST rate > 100%
2. **Expected Result**:
   - Validation error or capped at 100%

### Test 12.4: Duplicate Voucher Number

1. Try creating voucher with same number (if manual override allowed)
2. **Expected Result**:
   - Error or warning (based on configuration)

---

## Part 13: Testing API Endpoints

### Test 13.1: List Vouchers API

```bash
GET /api/vouchers
Authorization: Bearer <token>
```

**Expected**: List of vouchers with status, entries, inventory lines

### Test 13.2: Post Voucher API

```bash
POST /api/vouchers/:id/post
Authorization: Bearer <token>
```

**Expected**: Voucher status updated to POSTED

### Test 13.3: List Items API

```bash
GET /api/items
Authorization: Bearer <token>
```

**Expected**: List of items with HSN/SAC, rates, GST

### Test 13.4: List Warehouses API

```bash
GET /api/warehouses
Authorization: Bearer <token>
```

**Expected**: List of warehouses

---

## Part 14: Integration Testing

### Test 14.1: Complete Sales Cycle

1. Create Purchase voucher → Stock increases
2. Create Sales voucher → Stock decreases
3. Create Receipt voucher → Customer outstanding reduces
4. Verify all ledgers updated correctly

### Test 14.2: Complete Purchase Cycle

1. Create Purchase voucher → Stock increases, Supplier payable increases
2. Create Payment voucher → Supplier payable reduces
3. Verify GST input credit available

---

## Common Issues & Troubleshooting

### Issue: "No CASH or BANK ledger found"
**Solution**: Ensure seed script created Cash and Bank ledgers with proper `ledgerSubtype`

### Issue: "No SALES ledger found"
**Solution**: Create a ledger with `ledgerSubtype: SALES` or in DIRECT_INCOME group

### Issue: GST not calculating
**Solution**: 
- Check GST registration exists
- Check GST ledger mappings are created
- Verify place of supply is set

### Issue: Stock not updating
**Solution**:
- Verify inventory lines are included in voucher
- Check warehouse exists
- Verify item exists

### Issue: Voucher posting fails
**Solution**:
- Check voucher is not already posted
- Verify entries are balanced
- Check all required fields are filled

---

## Success Criteria

✅ All voucher types can be created and posted  
✅ Ledger balances update correctly  
✅ Inventory stock tracks properly  
✅ GST calculates and posts correctly  
✅ Financial reports show accurate data  
✅ Draft/Post workflow works  
✅ All validations prevent invalid data  
✅ API endpoints return correct data  

---

## Next Steps After Testing

1. **Create Sample Data**: Create multiple vouchers of each type
2. **Test Reports**: Generate all financial reports
3. **Test Edge Cases**: Try invalid inputs, boundary conditions
4. **Performance Test**: Create 100+ vouchers and check performance
5. **Integration Test**: Test with other features (bills, cost centers, etc.)

---

## Notes

- All amounts are in INR (₹)
- GST rates are percentages (18% = 18)
- State codes: 29 = Karnataka, 09 = UP, etc.
- Voucher numbers auto-increment per type
- Draft vouchers don't affect ledger balances
- Only POSTED vouchers update financials

---

**Happy Testing! 🚀**


# Implementation Checklist

## ✅ Existing Capabilities

- [x] Multi-tenant startup provisioning via signup (creates startup + admin role)
- [x] Authentication flow with JWT-based sessions (`/auth/login`, `/auth/signup`, `/auth/me`)
- [x] Role & permission scaffolding (Admin plus seeded roles, permission strings persisted)
- [x] Core ledgers: mock bank accounts with transaction CRUD services
- [x] Inventory module (products, sales simulation) tied to transactions
- [x] AI dashboard endpoints (summary, cashflow chart, recent activity) and UI widgets
- [x] Tally XML import pipeline for ledgers, parties, and vouchers (basic CREDIT/DEBIT mapping)
- [x] Frontend auth guard + dashboard shell with AI insight components
- [x] Company master profile API (identity, contacts, multi-address support)
- [x] Company profile management UI (settings form with multi-address editing)
- [x] Fiscal configuration service & UI (financial year, books start, backdated controls, edit log toggle)
- [x] Security settings (TallyVault toggle, user access control, MFA switch)
- [x] Currency configuration service & UI (base code, symbol, formatting preferences)
- [x] Feature toggle service & UI (per-module enablement for accounting, inventory, taxation, etc.)
- [x] Voucher type catalog & numbering management (default types, series, settings UI)
- [x] Typed voucher entry (backend services + frontend form with bill-wise ledger lines)
- [x] Bill-wise receivables/payables tracking (bills, settlements, aging views, UI workflows)
- [x] Cost centre/category hierarchy and interest calculation settings (hierarchical categories, cost centers, interest profiles, party-level interest assignments)
- [x] GST/statutory configuration (multi-registration, tax rates, ledger mappings, UI workflows)
- [x] Edit log/audit trail service (comprehensive audit logging for all entity changes, filtering, summary views, UI)
- [x] Role management UI (comprehensive role and permission management, user role assignment, CRUD operations)
- [x] Enhanced Tally import/export (multi-series vouchers support, GST data import, Excel export templates for vouchers/ledgers/GST, enhanced voucher import with proper voucher types and numbering series)
- [x] AI workflows tied to real voucher data (voucher anomaly detection, variance analysis, AI-powered insights, enhanced scenario analysis using voucher data, integrated voucher alerts)
- [x] Financial Statements & Analytics (Trial Balance, Profit & Loss trading/gross/net, Balance Sheet, Cash Flow Statement, Financial Ratios dashboards)
- [x] Advanced Books & Registers (Cash Book, Bank Book, Day Book, Ledger Book, and Sales/Purchase/Payment/Receipt/Contra/Journal books fed by real voucher data)

## 🚧 Feature Parity Gaps

> Update this checklist as modules move from the backlog into production.

- [x] **Ledger Master Enhancements**
  - Credit-limit enforcement and automatic balance refresh on voucher posting (credit limits checked before voucher creation)
  - Related party classification within ledger master (currently handled via Party Master)
  - Multi-currency ledger handling, budget/variance controls, ledger merge/archive/deactivation flows (pending)
  - Tax extensions beyond GST (e.g., TDS profiles) plus explicit bill-wise toggle effects in UI (pending)

- [x] **Receivables & Payables Automation**
  - Bill ageing buckets with reminders, cash-flow projections, and receivable/payable analytics UI

- [x] **Cost Centre Reporting**
  - Centre-wise P&L, budget vs actual dashboards, and per-transaction allocation summaries surfaced in reports (P&L by cost centre implemented, budget vs actual pending)

- [x] **Budgeting Module**
  - Budget definitions at ledger/group/cost-centre level, variance analytics, and alerting on breaches (basic structure implemented, schema extension pending for persistent storage)

- [x] **Year-End Operations**
  - Automated closing entries (transfer P&L balances to Capital), depreciation runs (calculate and post depreciation on fixed assets), carry-forward workflows (carry forward closing balances as opening balances for new year)
  - Audit-period locks (pending - requires schema changes)

- [x] **Audit & Compliance**
  - Exception reports (negative balances, mismatches, unbalanced vouchers, credit limit violations) and enhanced edit-log dashboards
  - Voucher approval/verification workflows (pending - requires schema changes)

- [x] **Auxiliary Bookkeeping Tools**
  - Reversing journals (create reversal entries for existing vouchers)
  - In-voucher calculator, narration templates, recurring vouchers/schedules, PDC tracking, scenario modelling helpers (pending)

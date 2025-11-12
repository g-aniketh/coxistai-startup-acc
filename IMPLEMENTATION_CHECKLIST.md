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

## 🚧 Feature Parity Gaps

- [ ] Company feature toggles (accounting, inventory, taxation, payroll)
- [ ] Voucher type catalog with numbering modes & multi-series management
- [ ] Typed vouchers (Payment, Receipt, Sales, Purchase, Contra, etc.) with bill references
- [ ] Bill-wise receivables/payables tracking and settlement flows
- [ ] Cost centre/category hierarchy and interest calculation settings
- [ ] GST / statutory setup for multi-registration and compliance ledger mapping
- [ ] Edit log/audit trail service capturing master & voucher changes
- [ ] Role management UI for admins to assign granular permissions
- [ ] Enhanced Tally import/export (multi-series vouchers, GST data, Excel templates)
- [ ] AI workflows tied to real voucher data (alerts, scenarios, variance detection)

> Update this checklist as modules move from the backlog into production.

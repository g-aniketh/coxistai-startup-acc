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

## 🚧 Feature Parity Gaps
- [ ] Edit log/audit trail service capturing master & voucher changes
- [ ] Role management UI for admins to assign granular permissions
- [ ] Enhanced Tally import/export (multi-series vouchers, GST data, Excel templates)
- [ ] AI workflows tied to real voucher data (alerts, scenarios, variance detection)

> Update this checklist as modules move from the backlog into production.

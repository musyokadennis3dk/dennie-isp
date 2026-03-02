# Active Context: Azani ISP Information System

## Current State

**Project Status**: ✅ Fully implemented — Azani Internet Service Provider Information Management System

The application is a complete database-backed management system for Azani ISP, serving learning institutions (primary, junior, senior schools and colleges).

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] **Azani ISP Information System** — full implementation including:
  - Database schema (institutions, payments, monthly_bills, infrastructure_purchases)
  - Institution registration with contact person details
  - Payment capture (registration, installation, monthly, overdue fines, reconnection)
  - Infrastructure purchase tracking (PCs and LAN nodes)
  - Billing management (generate bills, mark overdue, disconnect defaulters)
  - Comprehensive reports (registered institutions, defaulters, disconnections, infrastructure)
  - Computations (installation costs, PC/LAN costs, monthly charges by type, aggregate totals)
  - Dashboard home page with live statistics

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Dashboard home with stats | ✅ Ready |
| `src/app/layout.tsx` | Root layout with navigation | ✅ Ready |
| `src/app/register/page.tsx` | Institution registration form | ✅ Ready |
| `src/app/institutions/page.tsx` | List all institutions | ✅ Ready |
| `src/app/institutions/[id]/page.tsx` | Institution detail view | ✅ Ready |
| `src/app/payments/page.tsx` | Record payments | ✅ Ready |
| `src/app/infrastructure/page.tsx` | Record infrastructure purchases | ✅ Ready |
| `src/app/billing/page.tsx` | Billing management | ✅ Ready |
| `src/app/reports/page.tsx` | All reports and computations | ✅ Ready |
| `src/db/schema.ts` | Database schema | ✅ Ready |
| `src/db/index.ts` | Database client | ✅ Ready |
| `src/lib/utils.ts` | Business logic utilities | ✅ Ready |
| `src/app/api/institutions/` | Institutions CRUD API | ✅ Ready |
| `src/app/api/payments/` | Payments API | ✅ Ready |
| `src/app/api/infrastructure/` | Infrastructure API | ✅ Ready |
| `src/app/api/billing/` | Billing management API | ✅ Ready |
| `src/app/api/reports/` | Reports API | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Business Rules Implemented

- Registration fee: KSh 8,500 (auto-recorded on registration)
- Installation fee: KSh 10,000
- Bandwidth costs: 4/10/20/25/50 Mbps at KSh 1,200/2,000/3,500/4,000/7,000
- PC cost: KSh 40,000 each
- LAN node tiers: 2-10 nodes KSh 10,000; 11-20 KSh 20,000; 21-40 KSh 30,000; 41-100 KSh 40,000
- Upgrade discount: 10% off new bandwidth cost
- Overdue fine: 15% of bill amount
- Reconnection fee: KSh 1,000
- Disconnection: 10th of month following overdue billing month

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-03-02 | Full Azani ISP Information System implemented |

# Azani ISP Information Management System

A full-stack web application for managing Azani Internet Service Provider's operations — including institution registration, payment tracking, infrastructure management, billing cycles, and comprehensive reporting.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Database Schema](#database-schema)
6. [Business Rules & Pricing](#business-rules--pricing)
7. [Pages & Features](#pages--features)
8. [API Reference](#api-reference)
9. [Utility Functions](#utility-functions)
10. [Development Commands](#development-commands)

---

## Overview

The Azani ISP Information System serves learning institutions — primary schools, junior schools, senior schools, and colleges — providing internet connectivity services. The system handles:

- **Institution Registration** — Enroll new institutions with contact details
- **Payment Capture** — Record registration, installation, monthly, overdue fines, and reconnection fees
- **Infrastructure Tracking** — Log PC and LAN node purchases per institution
- **Billing Management** — Generate monthly bills, mark overdue accounts, disconnect defaulters
- **Reports & Analytics** — View defaulters, disconnections, infrastructure summaries, and financial computations

---

## Tech Stack

| Technology    | Version  | Purpose                          |
|---------------|----------|----------------------------------|
| Next.js       | 16.x     | React framework with App Router  |
| React         | 19.x     | UI library                       |
| TypeScript    | 5.9.x    | Type-safe JavaScript             |
| Tailwind CSS  | 4.x      | Utility-first CSS styling        |
| Drizzle ORM   | 0.45.x   | Type-safe database ORM           |
| SQLite        | —        | Embedded database                |
| Bun           | Latest   | Package manager & runtime        |

---

## Project Structure

```
/
├── package.json                    # Dependencies and scripts
├── drizzle.config.ts               # Drizzle ORM configuration
├── next.config.ts                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
├── postcss.config.mjs              # PostCSS / Tailwind config
├── eslint.config.mjs               # ESLint configuration
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout + navigation bar
│   │   ├── page.tsx                # Dashboard home page
│   │   ├── globals.css             # Global styles (Tailwind imports)
│   │   │
│   │   ├── register/page.tsx       # Institution registration form
│   │   ├── institutions/
│   │   │   ├── page.tsx            # List all institutions
│   │   │   └── [id]/page.tsx       # Institution detail view
│   │   ├── payments/page.tsx       # Record payments
│   │   ├── infrastructure/page.tsx # Record infrastructure purchases
│   │   ├── billing/page.tsx        # Billing management
│   │   └── reports/page.tsx        # Reports and analytics
│   │
│   │   └── api/                    # REST API routes
│   │       ├── institutions/
│   │       │   ├── route.ts        # GET /api/institutions, POST /api/institutions
│   │       │   └── [id]/route.ts   # GET /api/institutions/:id, PUT, DELETE
│   │       ├── payments/route.ts   # GET /api/payments, POST /api/payments
│   │       ├── infrastructure/route.ts  # GET/POST /api/infrastructure
│   │       ├── billing/route.ts    # POST /api/billing (generate), PUT (mark overdue/disconnect)
│   │       └── reports/route.ts    # GET /api/reports?type=...
│   │
│   ├── db/
│   │   ├── schema.ts               # Drizzle table definitions + constants
│   │   ├── index.ts                # Database client (SQLite connection)
│   │   ├── migrate.ts              # Migration runner
│   │   └── migrations/             # SQL migration files
│   │       └── 0000_wonderful_vermin.sql
│   │
│   └── lib/
│       └── utils.ts                # Business logic utility functions
│
└── .kilocode/                      # AI context and recipes
    └── rules/memory-bank/          # Project documentation for AI
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed (`curl -fsSL https://bun.sh/install | bash`)

### Installation

```bash
# Install dependencies
bun install

# Run database migrations (creates local.db)
bun run db:migrate

# Start development server
bun dev
```

The app will be available at **http://localhost:3000**.

---

## Database Schema

The system uses **SQLite** via **Drizzle ORM**. Four tables are defined in [`src/db/schema.ts`](src/db/schema.ts):

### `institutions`

Stores all registered learning institutions.

| Column               | Type      | Description                                      |
|----------------------|-----------|--------------------------------------------------|
| `id`                 | INTEGER   | Primary key, auto-increment                      |
| `name`               | TEXT      | Institution name                                 |
| `type`               | TEXT      | `primary`, `junior`, `senior`, `college`         |
| `address`            | TEXT      | Physical address                                 |
| `county`             | TEXT      | County location                                  |
| `email`              | TEXT      | Unique email address                             |
| `phone`              | TEXT      | Phone number                                     |
| `contact_name`       | TEXT      | Contact person's full name                       |
| `contact_role`       | TEXT      | Contact person's role/title                      |
| `contact_phone`      | TEXT      | Contact person's phone                           |
| `contact_email`      | TEXT      | Contact person's email                           |
| `registration_status`| TEXT      | `pending` or `registered`                        |
| `registration_date`  | INTEGER   | Timestamp of registration                        |
| `bandwidth_mbps`     | INTEGER   | Current bandwidth: 4/10/20/25/50 Mbps            |
| `service_status`     | TEXT      | `inactive`, `active`, or `disconnected`          |
| `connection_date`    | INTEGER   | Timestamp when service was activated             |
| `has_computers`      | INTEGER   | Boolean — has PCs been purchased                 |
| `has_lan`            | INTEGER   | Boolean — has LAN been installed                 |
| `number_of_users`    | INTEGER   | Number of internet users                         |
| `created_at`         | INTEGER   | Record creation timestamp                        |
| `updated_at`         | INTEGER   | Last update timestamp                            |

---

### `payments`

Records all financial transactions.

| Column           | Type    | Description                                                        |
|------------------|---------|--------------------------------------------------------------------|
| `id`             | INTEGER | Primary key                                                        |
| `institution_id` | INTEGER | Foreign key → `institutions.id`                                    |
| `payment_type`   | TEXT    | `registration`, `installation`, `monthly`, `overdue_fine`, `reconnection` |
| `amount`         | REAL    | Amount in KSh                                                      |
| `payment_date`   | INTEGER | Timestamp of payment                                               |
| `billing_month`  | TEXT    | `YYYY-MM` format (for monthly payments)                            |
| `bandwidth_mbps` | INTEGER | Bandwidth at time of payment                                       |
| `is_upgrade`     | INTEGER | Boolean — was this an upgrade payment                              |
| `discount_amount`| REAL    | Discount applied (upgrade discount)                                |
| `notes`          | TEXT    | Optional notes                                                     |
| `status`         | TEXT    | `paid`, `pending`, or `overdue`                                    |

---

### `monthly_bills`

Tracks monthly billing cycles per institution.

| Column            | Type    | Description                                              |
|-------------------|---------|----------------------------------------------------------|
| `id`              | INTEGER | Primary key                                              |
| `institution_id`  | INTEGER | Foreign key → `institutions.id`                          |
| `billing_month`   | TEXT    | `YYYY-MM` format                                         |
| `bandwidth_mbps`  | INTEGER | Bandwidth for that billing month                         |
| `base_amount`     | REAL    | Base monthly charge before discounts                     |
| `is_upgrade`      | INTEGER | Boolean — was this an upgrade month                      |
| `discount_amount` | REAL    | Upgrade discount applied (10%)                           |
| `total_amount`    | REAL    | Final amount due                                         |
| `due_date`        | INTEGER | Last day of the billing month                            |
| `paid_date`       | INTEGER | Timestamp when paid (nullable)                           |
| `status`          | TEXT    | `pending`, `paid`, `overdue`, or `disconnected`          |
| `overdue_fine`    | REAL    | 15% fine applied if overdue                              |
| `reconnection_fee`| REAL    | KSh 1,000 if reconnected after disconnection             |
| `created_at`      | INTEGER | Record creation timestamp                                |

---

### `infrastructure_purchases`

Tracks PC and LAN node purchases per institution.

| Column               | Type    | Description                                    |
|----------------------|---------|------------------------------------------------|
| `id`                 | INTEGER | Primary key                                    |
| `institution_id`     | INTEGER | Foreign key → `institutions.id`                |
| `purchase_date`      | INTEGER | Timestamp of purchase                          |
| `number_of_pcs`      | INTEGER | Number of PCs purchased                        |
| `pc_cost_total`      | REAL    | Total cost for PCs (count × KSh 40,000)        |
| `number_of_lan_nodes`| INTEGER | Number of LAN nodes purchased                  |
| `lan_cost_total`     | REAL    | Total cost for LAN nodes (tiered pricing)      |
| `total_cost`         | REAL    | Combined PC + LAN cost                         |
| `notes`              | TEXT    | Optional notes                                 |

---

## Business Rules & Pricing

All constants are defined in [`src/db/schema.ts`](src/db/schema.ts) and re-exported from [`src/lib/utils.ts`](src/lib/utils.ts).

### One-Time Fees

| Fee                | Amount      |
|--------------------|-------------|
| Registration Fee   | KSh 8,500   |
| Installation Fee   | KSh 10,000  |
| PC Cost (each)     | KSh 40,000  |
| Reconnection Fee   | KSh 1,000   |

> **Note:** The registration fee is automatically recorded as a payment when an institution is enrolled.

### Monthly Bandwidth Pricing

| Bandwidth | Monthly Cost |
|-----------|-------------|
| 4 Mbps    | KSh 1,200   |
| 10 Mbps   | KSh 2,000   |
| 20 Mbps   | KSh 3,500   |
| 25 Mbps   | KSh 4,000   |
| 50 Mbps   | KSh 7,000   |

### LAN Node Pricing (Tiered)

| Nodes     | Cost        |
|-----------|-------------|
| 2–10      | KSh 10,000  |
| 11–20     | KSh 20,000  |
| 21–40     | KSh 30,000  |
| 41–100    | KSh 40,000  |

### Penalties & Discounts

| Rule                | Value                          |
|---------------------|--------------------------------|
| Overdue Fine        | 15% of the bill amount         |
| Upgrade Discount    | 10% off the new bandwidth cost |
| Disconnection Date  | 10th of the month following the overdue billing month |

---

## Pages & Features

### 🏠 Dashboard (`/`)

- **Hero banner** with quick-action buttons
- **Live statistics**: total institutions, active connections, disconnected, overdue bills, total revenue
- **Quick action cards** linking to all major sections
- **Service fee schedule** showing all current pricing

### 🏫 Register Institution (`/register`)

Form to enroll a new learning institution. Captures:
- Institution name, type, address, county, email, phone
- Contact person details (name, role, phone, email)
- Number of users, whether they have computers/LAN

On submission, the registration fee (KSh 8,500) is automatically recorded.

### 📋 Institutions (`/institutions`)

Lists all registered institutions with:
- Name, type, county, service status, bandwidth
- Links to individual institution detail pages

### 📄 Institution Detail (`/institutions/[id]`)

Shows full details for a single institution:
- Contact information
- Service status and bandwidth
- Payment history
- Infrastructure purchases
- Monthly billing history

### 💳 Record Payment (`/payments`)

Form to record a payment. Supports payment types:
- **Installation** — activates the institution's service
- **Monthly** — records a monthly bandwidth payment (with optional upgrade discount)
- **Overdue Fine** — records a 15% fine on an overdue bill
- **Reconnection** — automatically added when a disconnected institution pays monthly

### 🖥️ Infrastructure (`/infrastructure`)

Form to record PC and LAN node purchases for an institution. Automatically calculates costs using tiered pricing.

### 📅 Billing Management (`/billing`)

Three actions:
1. **Generate Bills** — Creates monthly bills for all active institutions for a given `YYYY-MM` month
2. **Mark Overdue** — Marks all pending bills past their due date as overdue (adds 15% fine)
3. **Disconnect Defaulters** — Disconnects institutions with overdue bills past the 10th of the following month

### 📊 Reports & Analytics (`/reports`)

Five report types:
1. **Registered Institutions** — All enrolled institutions
2. **Defaulters** — Institutions with overdue bills
3. **Disconnected** — Institutions with disconnected service
4. **Infrastructure** — PC and LAN details per institution
5. **Computations** — Financial breakdown: installation costs, PC/LAN costs, monthly charges by institution type, overdue fines, reconnection fees, and aggregate totals per institution

---

## API Reference

All API routes are under `/api/`. They return JSON and use standard HTTP status codes.

### Institutions

#### `GET /api/institutions`
Returns all institutions ordered by name.

#### `POST /api/institutions`
Creates a new institution and records the registration fee.

**Request body:**
```json
{
  "name": "Nairobi Primary School",
  "type": "primary",
  "address": "123 Main St",
  "county": "Nairobi",
  "email": "info@nairobiprimary.ac.ke",
  "phone": "+254700000000",
  "contactName": "Jane Doe",
  "contactRole": "Principal",
  "contactPhone": "+254711111111",
  "contactEmail": "jane@nairobiprimary.ac.ke",
  "numberOfUsers": 200,
  "hasComputers": false,
  "hasLan": false
}
```

#### `GET /api/institutions/[id]`
Returns a single institution by ID.

#### `PUT /api/institutions/[id]`
Updates an institution's details.

#### `DELETE /api/institutions/[id]`
Deletes an institution.

---

### Payments

#### `GET /api/payments`
Returns all payments ordered by date.

#### `POST /api/payments`
Records a payment. Behavior varies by `paymentType`:

- **`installation`** — Records KSh 10,000, activates institution service
- **`monthly`** — Records monthly bandwidth payment, creates/updates `monthly_bills` record; if institution was disconnected, also records reconnection fee and reactivates service
- **`overdue_fine`** — Records 15% fine on the specified billing month's bill

**Request body:**
```json
{
  "institutionId": 1,
  "paymentType": "monthly",
  "billingMonth": "2026-03",
  "bandwidthMbps": 10,
  "isUpgrade": false,
  "notes": "March payment"
}
```

---

### Infrastructure

#### `GET /api/infrastructure`
Returns all infrastructure purchase records.

#### `POST /api/infrastructure`
Records a new infrastructure purchase. Automatically calculates costs.

**Request body:**
```json
{
  "institutionId": 1,
  "numberOfPcs": 5,
  "numberOfLanNodes": 8,
  "notes": "Initial setup"
}
```

---

### Billing

#### `POST /api/billing`
Generates monthly bills for all active institutions.

**Request body:**
```json
{ "billingMonth": "2026-03" }
```

**Response:**
```json
{ "success": true, "created": 12, "skipped": 2, "bills": [...] }
```

#### `PUT /api/billing`
Performs billing management actions.

**Mark overdue:**
```json
{ "action": "mark_overdue" }
```

**Disconnect defaulters:**
```json
{ "action": "disconnect" }
```

---

### Reports

#### `GET /api/reports?type=registered`
All registered institutions.

#### `GET /api/reports?type=defaulters`
Institutions with overdue bills (joined with bill details).

#### `GET /api/reports?type=disconnected`
Institutions with `service_status = 'disconnected'`.

#### `GET /api/reports?type=infrastructure`
All institutions with their infrastructure purchase records (left join).

#### `GET /api/reports?type=computations`
Aggregate financial computations:
```json
{
  "installationByInstitution": { "1": 10000 },
  "infraByInstitution": { "1": { "pcCost": 200000, "lanCost": 10000, "total": 210000 } },
  "monthlyByType": { "primary": 14400, "college": 84000 },
  "finesByType": { "primary": { "overdue": 180, "reconnection": 1000 } },
  "aggregateByInstitution": [
    {
      "institution": { ... },
      "registration": 8500,
      "installation": 10000,
      "monthly": 14400,
      "overdueFines": 180,
      "reconnection": 1000,
      "infraCost": 210000,
      "total": 244080
    }
  ]
}
```

---

## Utility Functions

Defined in [`src/lib/utils.ts`](src/lib/utils.ts):

| Function | Description |
|----------|-------------|
| `getBandwidthCost(mbps)` | Returns monthly cost for a given bandwidth |
| `getLanNodeCost(nodes)` | Returns LAN node cost using tiered pricing |
| `getPcCost(count)` | Returns total PC cost (`count × 40,000`) |
| `calculateUpgradeCost(newMbps)` | Returns upgrade cost with 10% discount applied |
| `calculateOverdueFine(amount)` | Returns 15% of the given amount |
| `formatKsh(amount)` | Formats a number as `KSh X,XXX.XX` |
| `getCurrentBillingMonth()` | Returns current month as `YYYY-MM` |
| `getBillingMonthDueDate(month)` | Returns last day of the billing month |
| `getDisconnectionDate(month)` | Returns 10th of the month following the billing month |

---

## Development Commands

| Command | Purpose |
|---------|---------|
| `bun install` | Install all dependencies |
| `bun dev` | Start development server (http://localhost:3000) |
| `bun build` | Build for production |
| `bun start` | Start production server |
| `bun lint` | Run ESLint checks |
| `bun typecheck` | Run TypeScript type checking |
| `bun run db:generate` | Generate new Drizzle migration files |
| `bun run db:migrate` | Apply pending migrations to `local.db` |

### Before Committing

Always run checks before pushing:
```bash
bun typecheck && bun lint && git add -A && git commit -m "your message" && git push
```

---

## License

Private — Azani Internet Service Provider © 2026

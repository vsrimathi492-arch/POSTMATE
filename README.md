# POSTMATE
## Smart Postal Operations Management System
### *Less Manual Work. More Smart Operations.*

POSTMATE is an integrated postal operations management platform designed for Sub Post Offices, Head Post Offices, and Branch Post Offices. It unifies web administration, mobile field delivery, and a central backend engine into a **single-source-of-truth architecture**.

---

## 1. Core Principle
> **ONE-TIME DATA ENTRY → AUTOMATIC MODULE UPDATES → REDUCED MANUAL WORK**
>
> Whenever consignment information or financial entries are verified once, all relevant modules consume the same central record. Postal staff and postmasters never re-enter identical information across different registers or screens.

---

## 2. Platforms & Technology Stack

| Platform | Technology Stack | Primary Users |
|---|---|---|
| **Web Console** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons | Postmasters, Supervisors, Admins |
| **Mobile Client** | React Native, Expo, TypeScript, Offline Queue Storage | Beat Delivery Postmen, Counter Staff |
| **Backend API** | Node.js, Express, TypeScript, REST API, PDFKit | Central Operations Engine |
| **Database** | MongoDB / High-Performance Local JSON Fallback Store | Single Source of Truth |
| **Shared Lib** | `@postmate/shared` (Enums, Types, Validation, RBAC) | Unified Contract |

---

## 3. Demo Accounts & User Roles

For demonstration and testing, the application includes pre-configured accounts (Password for all: `password123`):

| Role | Employee ID | Name | Focus |
|---|---|---|---|
| **Postmaster** | `PM600040` | S. Meenakshi Sundaram | Full operations, approvals, cashbook reconciliation, report sign-off |
| **Postal Assistant** | `PA600041` | V. Murugan | Counter booking, smart scanning, sorting batches |
| **Beat Postman** | `PMTS600042` | R. Anbarasan | Beat deliveries, signature proof, exception logs |
| **Administrator** | `ADMIN001` | K. Rajasekaran | Post office configuration, user permissions, audit logs |

*Tip: The web and mobile login screens also feature 1-Click Quick Role Switchers for testing.*

---

## 4. Key Modules & Operational Workflows

1. **Digital Mail Register & Management**:
   - Central digital registers for Incoming and Outgoing mail with category filters (Speed Post, Registered Post, Parcels, Letters, Money Orders).
   - Duplicate detection engine halts accidental duplicate entries with instant alerts.
   - Comprehensive lifecycle timeline from reception to delivery.

2. **Smart Mail Scanning & Assisted OCR**:
   - Barcode scanning with format validation.
   - Optical Character Recognition (OCR) extracts consignment codes, recipient, and address with confidence scoring.
   - **Mandatory Staff Verification Checkbox**: Guarantees physical inspection before database commitment.

3. **Smart Sorting & Beat Grouping**:
   - Auto-groups scanned mail items by destination area, pincode, and beat.
   - Single-click sorting batch creation with auto-updating statuses.

4. **Beat Delivery Management & Exceptions**:
   - Task assignment to authorized delivery staff with capacity indicators.
   - Postmen mark items as **Delivered** (with recipient name and signature capture) or **Exception** (standard reasons: *Door Locked*, *Insufficient Address*, *Addressee Moved*, etc.).
   - Exceptions immediately trigger supervisor alerts.

5. **Cashbook & Accounts Reconciliation**:
   - Running ledger calculations: `Opening Balance + Receipts - Payments = Calculated Closing Balance`.
   - Dedicated physical safe cash count reconciliation interface with live variance/discrepancy computation.
   - Postmaster verification workflows.

6. **Automatic Report Generation & PDF Export**:
   - Compiles official Daily Operations Reports directly from verified records without re-entry.
   - Generates downloadable, print-ready official PDF reports with signature sections.

7. **Customer Postal Enquiry**:
   - Tracking lookup with automatic privacy masking of sensitive customer phone numbers and addresses for public view.

8. **Offline-First Synchronization (Mobile)**:
   - Queues field deliveries and scans in local storage when disconnected.
   - Synchronizes automatically upon reconnection with conflict detection to prevent silent data loss.

9. **Bilingual Localization**:
   - Instant language switching between **English** and **Tamil (தமிழ்)** across all interface modules.

---

## 5. Quick Start Instructions

### Prerequisites
- Node.js (v18 or higher)
- NPM or PNPM

### Step 1: Environment & Dependencies
```bash
# Copy environment template to .env (keep .env out of git)
cp .env.example .env

# In the repository root, install all workspace dependencies (API, Web, Mobile, Shared)
npm install

# Build shared types package
npm --prefix packages/shared run build

# Build backend API
npm --prefix apps/api run build

# Build web console
npm --prefix apps/web run build
```

### Step 2: Run Backend API, Web Application & Mobile App
```bash
# Terminal 1: Start Backend API (runs on http://localhost:5000)
npm run dev:api

# Terminal 2: Start Web Application (runs on http://localhost:5173, proxies /api -> :5000)
npm run dev:web

# Terminal 3: Start Android / Expo Mobile Application
npm run dev:mobile
```
*Note for Physical Android Devices:* Open **Profile → Backend Server URL** inside the mobile app and set it to `http://<YOUR_PC_LAN_IP>:5000` (Android Emulators use `http://10.0.2.2:5000` automatically).

### Step 3: Run Automated Test Suite & Type Checks
```bash
npm --prefix apps/api test
cd apps/mobile && npx tsc --noEmit
```

---

## 6. Project Structure

```
POSTMATE/
├── apps/
│   ├── api/                  # Express REST API & Automation Engine
│   │   ├── src/
│   │   │   ├── config/       # Database & JWT configuration
│   │   │   ├── controllers/  # Module controllers
│   │   │   ├── middleware/   # JWT auth & RBAC
│   │   │   ├── repositories/ # Abstract data repositories
│   │   │   ├── routes/       # Express route handlers
│   │   │   ├── seed/         # Realistic demonstration dataset
│   │   │   ├── services/     # AutomationEngine & PdfService
│   │   │   └── __tests__/    # Jest API integration tests
│   ├── web/                  # Vite + React Desktop Web Application
│   │   ├── src/
│   │   │   ├── components/   # Modals, layout, cards, badges
│   │   │   ├── context/      # Auth & Language contexts
│   │   │   ├── i18n/         # English & Tamil translations
│   │   │   ├── pages/        # 18 complete module pages
│   │   │   └── services/     # API client
│   └── mobile/               # React Native / Expo Android Client
│       └── src/
│           ├── components/   # Offline banners & modals
│           ├── screens/      # Scan, tasks, sync, profile screens
│           └── services/     # Offline storage & sync service
├── packages/
│   └── shared/               # Shared TypeScript schemas, DTOs & types
├── database/                 # Schemas & persistent storage
├── docs/                     # Architecture, workflow, and API documentation
├── .env.example              # Sample environment configuration
└── README.md
```

---

## 7. Important Product Boundary Notice

POSTMATE is an independent operational prototype designed to demonstrate workflow modernization, automation, and reduced administrative workload in postal operations. It is **not** an official India Post application, does not utilize official emblems or logos, and does not claim official departmental endorsement. Integration with official governmental or postal APIs requires prior departmental authorization and compliance review.

# POSTMATE System Architecture

## 1. Overview
POSTMATE is an integrated postal operations management system architected to automate manual record-keeping, prevent repetitive data entry, and streamline operations across Sub Post Offices (Town), Head Post Offices (Urban), and Branch Post Offices (Village).

## 2. Monorepo Organization
```
POSTMATE/
├── apps/
│   ├── web/        # React + Vite + TypeScript (Postmasters & Administrators desktop/tablet console)
│   ├── mobile/     # React Native + Expo (Postal staff & beat delivery postmen offline-ready client)
│   └── api/        # Node.js + Express + TypeScript + REST API (Single source of truth)
├── packages/
│   └── shared/     # Shared domain types, constants, DTOs, and RBAC policies
├── database/
│   ├── schemas/    # Schema definitions
│   └── seed-data/  # Realistic operational demonstration data
└── docs/           # Architecture specs, workflow guides, and REST API documentation
```

## 3. Core Principle: Single-Source-of-Truth
```
[Staff Scans/Enters Consignment Once]
                 │
                 ▼
[Validation & Duplicate Detection Engine]
                 │
                 ▼
[Central Database Record Created (IMailRecord)]
                 │
  ┌──────────────┼───────────────┬────────────────┐
  ▼              ▼               ▼                ▼
[Digital    [Smart Sorting  [Beat Delivery   [Auto-Compiled
Register]    Area Batches]   Assignments]     Daily Reports]
```

## 4. Platform Roles & RBAC Matrix
1. **ADMIN**: Post office configurations, authorized personnel onboarding, role permissions, and full immutable audit log reviews.
2. **POSTMASTER**: Operational oversight, mail incoming/outgoing monitoring, task assignments, physical cashbook reconciliation approval, and daily operations sign-off.
3. **POSTAL STAFF / POSTMAN**: Consignment scanning, sorting batch creation, beat delivery status updating (Delivered with signature or Exception with standardized reasons), personal task queues, and offline batch sync.

## 5. Persistence Architecture
- **Primary**: MongoDB (Mongoose)
- **Zero-Setup Local Persistence Fallback**: High-performance JSON-based storage engine enabling instant execution without pre-requisite database services.
- **Mobile Local Storage**: SQLite / AsyncStorage offline queue with conflict detection.

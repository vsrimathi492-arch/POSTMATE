# POSTMATE Automation Engine

## Core Purpose
The Automation Engine (`apps/api/src/services/automationEngine.ts`) eliminates redundant data entry across all postal modules. Once an item or transaction is verified, every dependent module consumes the same central record.

## Automated Workflows

### 1. One-Time Mail Registration
1. Staff member scans parcel label via camera or wedge barcode reader.
2. OCR engine extracts tracking reference, recipient, and destination pincode with confidence score.
3. Staff performs physical inspection and checks verification checkbox.
4. Engine checks for duplicates. If duplicate is detected, operation is halted with conflict details.
5. Central `IMailRecord` is persisted.
6. **Automatic Cascade**:
   - Digital Mail Register summary increments.
   - Smart Sorting module groups the item under its destination beat area.
   - Live Dashboard counters recalculate.

### 2. Smart Delivery Assignment & Beat Sync
1. Postmaster or supervisor assigns consignment to authorized beat postman.
2. Mail item status updates to `OUT_FOR_DELIVERY`.
3. Delivery task appears in real-time in the assigned postman's mobile application.
4. Staff workload metrics update automatically.

### 3. Delivery Execution & Exception Handling
1. Postman delivers item and captures recipient relationship and signature proof.
2. Status updates to `DELIVERED` with exact timestamp.
3. If delivery fails (e.g. `DOOR_LOCKED`, `INSUFFICIENT_ADDRESS`):
   - Status updates to `EXCEPTION`.
   - Postmaster receives an alert notification immediately.
   - Item is flagged for next-day re-attempt.

### 4. Zero Re-entry Report Generation
- When generating the Daily Operations Report, the engine pulls directly from verified records:
  - Total incoming, outgoing, and category breakdowns.
  - Delivery completion percentages.
  - Cash ledger running totals.
  - Staff workload distribution.
- Staff never re-keys data to create official reports.

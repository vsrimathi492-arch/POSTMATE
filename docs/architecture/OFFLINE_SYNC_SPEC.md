# POSTMATE Offline-First Sync Specification

## 1. Mobile Offline Architecture
Beat postmen frequently deliver in remote, rural, or low-connectivity zones. POSTMATE mobile provides offline persistence via local storage queues (`AsyncStorage` / SQLite).

```
   [Offline Device Action]
              │
              ▼
    [Local Storage Queue]
   { localId, action, payload }
              │
    [Network Reconnection]
              │
              ▼
   [POST /api/sync/batch]
              │
   ┌──────────┴──────────┐
   ▼                     ▼
[Clean Sync]      [Conflict Detected]
• Status -> SYNCED • Higher priority server record exists
• Removed from queue• Flagged in local conflict list
                   • Prevents silent overwriting
```

## 2. Queue Item Schema
```typescript
interface OfflineSyncQueueItem {
  localId: string;       // Unique client-generated ID
  action: 'CREATE_MAIL' | 'UPDATE_DELIVERY' | 'CREATE_CASH_TRANSACTION';
  entityType: 'MAIL' | 'DELIVERY' | 'CASH';
  payload: any;
  createdAt: string;
  attempts: number;
  status: 'PENDING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
}
```

## 3. Conflict Resolution Strategy
- **Terminal State Precedence**: If a consignment is marked `DELIVERED` on the server by another counter, an older offline `EXCEPTION` update will not overwrite the delivery. A conflict record is created for user review.
- **Duplicate Prevention**: Client-assigned `localId` prevents repeated insertions if network drops mid-sync.

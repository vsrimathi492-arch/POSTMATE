# POSTMATE REST API Documentation

Base URL: `http://localhost:5000/api`

## Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate with employeeId & password | Public |
| `GET` | `/api/auth/me` | Fetch active user session | Authenticated |

## Mail Management (`/api/mail`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/mail` | Filterable list of mail records | Staff, PM, Admin |
| `GET` | `/api/mail/summary` | Register count summary by category | Staff, PM, Admin |
| `GET` | `/api/mail/:id` | Full mail record with lifecycle timeline | Staff, PM, Admin |
| `POST` | `/api/mail` | One-time mail registration with duplicate check | Staff, PM |
| `PATCH` | `/api/mail/:id` | Update mail record details | Staff, PM |

## Smart Scanning & OCR (`/api/scan`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/scan/barcode` | Barcode format check & duplicate detection | Staff, PM |
| `POST` | `/api/scan/ocr` | Assistive OCR parcel text extraction | Staff, PM |

## Smart Sorting (`/api/sorting`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/sorting/suggestions`| Area & category grouping suggestions | Staff, PM |
| `GET` | `/api/sorting/batches` | List sorting batches | Staff, PM |
| `POST` | `/api/sorting/batches` | Create new sorting batch | Staff, PM |

## Delivery Management (`/api/delivery`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/delivery` | All active office deliveries | Staff, PM |
| `GET` | `/api/delivery/my` | Assigned beat deliveries for logged-in postman | Staff, PM |
| `GET` | `/api/delivery/summary`| Delivery success rates & agent workload | Staff, PM |
| `POST` | `/api/delivery/assign` | Assign mail item to postman | Postmaster |
| `PATCH`| `/api/delivery/status/:mailId` | Update delivery (Delivered / Exception) | Staff, PM |

## Cashbook & Accounts (`/api/cashbook`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/cashbook/transactions`| Date-wise cash transactions | Staff, PM |
| `GET` | `/api/cashbook/balance` | Calculated closing balance & reconciliation | Staff, PM |
| `POST` | `/api/cashbook/transactions`| Record receipt or payment | Staff, PM |
| `PATCH`| `/api/cashbook/transactions/:id/verify` | Postmaster verification | Postmaster |
| `POST` | `/api/cashbook/reconcile` | Physical chest cash reconciliation | Postmaster |

## Automatic Reports (`/api/reports`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/reports` | List generated operations reports | Staff, PM |
| `POST` | `/api/reports/generate` | Auto-compile report from database records | Staff, PM |
| `PATCH`| `/api/reports/:id/approve`| Official Postmaster sign-off | Postmaster |
| `GET` | `/api/reports/:id/pdf` | Download official formatted PDF | Staff, PM |

## Offline Mobile Sync (`/api/sync`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/sync/batch` | Synchronize mobile offline action queue | Staff, PM |

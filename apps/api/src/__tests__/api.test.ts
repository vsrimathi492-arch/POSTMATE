import request from 'supertest';
import { app } from '../index';
import { seedDatabase } from '../seed/seedData';
import { MailCategory, MailDirection, MailStatus, DeliveryExceptionReason, TransactionType, CashCategory } from '@postmate/shared';

describe('POSTMATE API Integration & Automation Test Suite', () => {
  let postmasterToken = '';
  let staffToken = '';

  beforeAll(async () => {
    await seedDatabase();

    // Login as Postmaster
    const pmRes = await request(app)
      .post('/api/auth/login')
      .send({ employeeId: 'PM600040', password: 'password123' });
    postmasterToken = pmRes.body.token;

    // Login as Postal Assistant
    const staffRes = await request(app)
      .post('/api/auth/login')
      .send({ employeeId: 'PA600041', password: 'password123' });
    staffToken = staffRes.body.token;
  });

  test('1. Health check returns ONLINE status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ONLINE');
    expect(res.body.system).toContain('POSTMATE');
  });

  test('2. Authentication: valid login returns JWT and user profile', async () => {
    expect(postmasterToken).toBeDefined();
    expect(staffToken).toBeDefined();
  });

  test('3. Authentication: rejects invalid credentials safely', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ employeeId: 'PM600040', password: 'wrong_password' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('4. Mail Management: One-Time Entry and Duplicate Detection', async () => {
    const testTracking = `SP${Date.now().toString().slice(-9)}IN`;

    // First entry: should succeed
    const createRes = await request(app)
      .post('/api/mail')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        trackingNumber: testTracking,
        direction: MailDirection.INCOMING,
        category: MailCategory.SPEED_POST,
        originOffice: 'Delhi GPO',
        originPincode: '110001',
        destinationOffice: 'Anna Nagar Sub Post Office',
        destinationPincode: '600040',
        senderName: 'Ministry of Finance',
        senderAddress: 'North Block, New Delhi',
        recipientName: 'K. Senthil Nathan',
        recipientAddress: '14, 2nd Avenue, Anna Nagar',
        weightGrams: 150
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.mail.trackingNumber).toBe(testTracking);
    expect(createRes.body.mail.currentStatus).toBe(MailStatus.SCANNED);

    // Second entry with identical tracking: Duplicate detection must block it!
    const dupRes = await request(app)
      .post('/api/mail')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        trackingNumber: testTracking,
        direction: MailDirection.INCOMING,
        category: MailCategory.SPEED_POST,
        recipientName: 'Duplicate Attempt',
        recipientAddress: 'Same address'
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.isDuplicate).toBe(true);
    expect(dupRes.body.message).toContain('Duplicate item detected');
  });

  test('5. Delivery Management: Delivery Assignment and Status Update', async () => {
    // List mail items
    const listRes = await request(app)
      .get('/api/mail')
      .set('Authorization', `Bearer ${postmasterToken}`);
    const targetMail = listRes.body.items[0];

    // Assign to postman
    const assignRes = await request(app)
      .post('/api/delivery/assign')
      .set('Authorization', `Bearer ${postmasterToken}`)
      .send({
        mailId: targetMail.id,
        staffId: 'USER-STAFF-02'
      });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.mail.currentStatus).toBe(MailStatus.OUT_FOR_DELIVERY);

    // Update status to DELIVERED
    const delivRes = await request(app)
      .patch(`/api/delivery/status/${targetMail.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        status: MailStatus.DELIVERED,
        deliveredTo: 'K. Senthil Nathan',
        recipientRelationship: 'Self',
        signatureDataUrl: 'data:image/svg+xml;utf8,signature-verified'
      });

    expect(delivRes.status).toBe(200);
    expect(delivRes.body.mail.currentStatus).toBe(MailStatus.DELIVERED);
  });

  test('6. Cashbook: Running balance calculations and reconciliation', async () => {
    // Add receipt transaction
    const txRes = await request(app)
      .post('/api/cashbook/transactions')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        type: TransactionType.RECEIPT,
        category: CashCategory.SPEED_POST_BOOKING,
        amount: 150.00,
        description: 'Speed post booking counter collection'
      });

    expect(txRes.status).toBe(201);
    expect(txRes.body.transaction.amount).toBe(150);

    // Get calculated balance
    const balRes = await request(app)
      .get('/api/cashbook/balance')
      .set('Authorization', `Bearer ${postmasterToken}`);

    expect(balRes.status).toBe(200);
    const balance = balRes.body.balance;
    expect(balance.calculatedClosingBalance).toBe(balance.openingBalance + balance.totalReceipts - balance.totalPayments);

    // Reconcile with physical cash
    const recRes = await request(app)
      .post('/api/cashbook/reconcile')
      .set('Authorization', `Bearer ${postmasterToken}`)
      .send({
        verifiedPhysicalBalance: balance.calculatedClosingBalance,
        notes: 'Verified physical cash chest matches ledger calculation exactly.'
      });

    expect(recRes.status).toBe(200);
    expect(recRes.body.balance.reconciliationStatus).toBe('RECONCILED');
    expect(recRes.body.balance.discrepancyAmount).toBe(0);
  });

  test('7. Automatic Report Generation: Single Source of Truth Compilation', async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const repRes = await request(app)
      .post('/api/reports/generate')
      .set('Authorization', `Bearer ${postmasterToken}`)
      .send({ date: todayStr });

    expect(repRes.status).toBe(200);
    expect(repRes.body.report.mailSummary.totalIncoming).toBeGreaterThanOrEqual(1);
    expect(repRes.body.report.remarks).toContain('Automatically compiled');

    // Approve report
    const approveRes = await request(app)
      .patch(`/api/reports/${repRes.body.report.id}/approve`)
      .set('Authorization', `Bearer ${postmasterToken}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.report.isApproved).toBe(true);
  });

  test('8. Offline Sync Endpoint: Mobile Queue Batch Synchronization', async () => {
    const offlineTracking = `RP${Date.now().toString().slice(-9)}IN`;
    const syncRes = await request(app)
      .post('/api/sync/batch')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        deviceId: 'POSTMAN-ANDROID-M30',
        userId: 'USER-STAFF-02',
        officeId: 'PO-600001',
        items: [
          {
            localId: 'local-queue-001',
            action: 'CREATE_MAIL',
            entityType: 'MAIL',
            payload: {
              trackingNumber: offlineTracking,
              direction: MailDirection.INCOMING,
              category: MailCategory.REGISTERED_POST,
              originOffice: 'Salem HPO',
              originPincode: '636001',
              destinationOffice: 'Anna Nagar Sub Post Office',
              destinationPincode: '600040',
              senderName: 'Anna University Examination Cell',
              senderAddress: 'Guindy, Chennai',
              recipientName: 'P. Vignesh',
              recipientAddress: '24, 6th Avenue, Anna Nagar'
            },
            createdAt: new Date().toISOString(),
            attempts: 1,
            status: 'PENDING'
          }
        ]
      });

    expect(syncRes.status).toBe(200);
    expect(syncRes.body.syncedCount).toBe(1);
    expect(syncRes.body.results[0].status).toBe('SYNCED');
  });

  test('9. RBAC & Security: Staff cannot assign deliveries or approve reports; Admin creates hashed user', async () => {
    const listRes = await request(app)
      .get('/api/mail')
      .set('Authorization', `Bearer ${postmasterToken}`);
    const mailItem = listRes.body.items[0];

    // Postal Staff blocked from official delivery assignment
    const forbiddenAssign = await request(app)
      .post('/api/delivery/assign')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ mailId: mailItem.id, staffId: 'USER-STAFF-02' });
    expect(forbiddenAssign.status).toBe(403);

    // Admin login & create new user (verifies bcrypt password hashing works at login)
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ employeeId: 'ADMIN001', password: 'password123' });
    expect(adminLogin.status).toBe(200);
    const adminToken = adminLogin.body.token;

    const newEmpId = `PA${Date.now().toString().slice(-6)}`;
    const createUserRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Postal Clerk',
        employeeId: newEmpId,
        password: 'securePass!99',
        role: 'POSTAL_STAFF',
        officeId: 'PO-600001'
      });
    expect(createUserRes.status).toBe(201);
    expect(createUserRes.body.user.password).toBeUndefined();

    // Verify new user can log in with hashed password
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ employeeId: newEmpId, password: 'securePass!99' });
    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.token).toBeDefined();
  });

  test('10. OCR Extraction, Smart Sorting, Enquiry Resolution & PDF Report Binary Export', async () => {
    // OCR parses custom label rawText accurately
    const ocrTracking = `SP${Date.now().toString().slice(-9)}IN`;
    const ocrRes = await request(app)
      .post('/api/scan/ocr')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        rawText: `${ocrTracking}\nTo: R. Karthikeyan\nAddress: 18, 4th Main Road, Anna Nagar\n600040\n240g`
      });
    expect(ocrRes.status).toBe(200);
    expect(ocrRes.body.extractedData.trackingNumber).toBe(ocrTracking);
    expect(ocrRes.body.extractedData.recipientName).toBe('R. Karthikeyan');
    expect(ocrRes.body.extractedData.destinationPincode).toBe('600040');
    expect(ocrRes.body.extractedData.weightGrams).toBe(240);
    expect(ocrRes.body.extractedData.fieldsVerified).toBe(false);

    // Sorting grouping supports category & destination
    const sortRes = await request(app)
      .get('/api/sorting/suggestions?groupBy=category')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(sortRes.status).toBe(200);
    expect(sortRes.body.groupBy).toBe('category');

    // Customer enquiry search + creation + resolution
    const enqCreate = await request(app)
      .post('/api/enquiry')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        trackingNumber: ocrTracking,
        customerName: 'R. Karthikeyan',
        subject: 'Delivery ETA Check',
        description: 'Checking arrival time'
      });
    expect(enqCreate.status).toBe(201);

    const enqResolve = await request(app)
      .patch(`/api/enquiry/${enqCreate.body.enquiry.id}/resolution`)
      .set('Authorization', `Bearer ${postmasterToken}`)
      .send({ resolutionStatus: 'RESOLVED', resolutionNotes: 'Informed customer.' });
    expect(enqResolve.status).toBe(200);
    expect(enqResolve.body.enquiry.resolutionStatus).toBe('RESOLVED');

    // Authenticated PDF export returns valid PDF binary
    const reportsRes = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${postmasterToken}`);
    const repId = reportsRes.body.reports[0]?.id || 'daily-latest';
    const pdfRes = await request(app)
      .get(`/api/reports/${repId}/pdf`)
      .set('Authorization', `Bearer ${postmasterToken}`);
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toContain('application/pdf');
    expect(pdfRes.body.slice(0, 4).toString()).toBe('%PDF');
  });
});

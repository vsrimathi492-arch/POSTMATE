import bcrypt from 'bcryptjs';
import { connectDatabase, flushMongoWrites, localStore } from '../config/database';
import {
  UserRole,
  OfficeType,
  MailCategory,
  MailDirection,
  MailStatus,
  TransactionType,
  CashCategory,
  DeliveryExceptionReason
} from '@postmate/shared';

export async function seedDatabase() {
  console.log('[POSTMATE Seed] Initializing realistic postal operations seed dataset...');

  // 1. Post Offices
  const offices = [
    {
      id: 'PO-600001',
      code: 'PO-600001',
      name: 'Anna Nagar Sub Post Office',
      type: OfficeType.TOWN,
      pincode: '600040',
      division: 'Chennai Central',
      region: 'Chennai Region',
      circle: 'Tamil Nadu Circle',
      contactNumber: '044-26214560',
      address: '2nd Avenue, Anna Nagar, Chennai, Tamil Nadu 600040',
      isActive: true
    },
    {
      id: 'PO-625001',
      code: 'PO-625001',
      name: 'Madurai Head Post Office',
      type: OfficeType.HEAD,
      pincode: '625001',
      division: 'Madurai Division',
      region: 'Southern Region',
      circle: 'Tamil Nadu Circle',
      contactNumber: '0452-2345678',
      address: 'Scott Road, Madurai, Tamil Nadu 625001',
      isActive: true
    },
    {
      id: 'PO-600017',
      code: 'PO-600017',
      name: 'T. Nagar City Post Office',
      type: OfficeType.CITY,
      pincode: '600017',
      division: 'Chennai South',
      region: 'Chennai Region',
      circle: 'Tamil Nadu Circle',
      contactNumber: '044-24341200',
      address: 'North Usman Road, T. Nagar, Chennai, Tamil Nadu 600017',
      isActive: true
    },
    {
      id: 'PO-625501',
      code: 'PO-625501',
      name: 'Alanganallur Branch Post Office',
      type: OfficeType.VILLAGE,
      pincode: '625501',
      division: 'Madurai Division',
      region: 'Southern Region',
      circle: 'Tamil Nadu Circle',
      contactNumber: '04543-22100',
      address: 'Main Bazaar, Alanganallur, Madurai, Tamil Nadu 625501',
      isActive: true
    }
  ];

  // 2. Users (Admin, Postmaster, Postal Staff)
  const defaultPassword = 'password123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const users = [
    {
      id: 'USER-ADMIN-01',
      employeeId: 'ADMIN001',
      name: 'K. Rajasekaran',
      email: 'admin.postal@postmate.internal',
      password: hashedPassword,
      role: UserRole.ADMIN,
      officeId: 'PO-600001',
      officeName: 'Anna Nagar Sub Post Office',
      officeType: OfficeType.TOWN,
      phone: '9840123450',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'USER-PM-01',
      employeeId: 'PM600040',
      name: 'S. Meenakshi Sundaram',
      email: 'postmaster.annanagar@postmate.internal',
      password: hashedPassword,
      role: UserRole.POSTMASTER,
      officeId: 'PO-600001',
      officeName: 'Anna Nagar Sub Post Office',
      officeType: OfficeType.TOWN,
      phone: '9840123451',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'USER-STAFF-01',
      employeeId: 'PA600041',
      name: 'V. Murugan',
      email: 'murugan.v@postmate.internal',
      password: hashedPassword,
      role: UserRole.POSTAL_STAFF,
      officeId: 'PO-600001',
      officeName: 'Anna Nagar Sub Post Office',
      officeType: OfficeType.TOWN,
      phone: '9840123452',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'USER-STAFF-02',
      employeeId: 'PMTS600042',
      name: 'R. Anbarasan (Beat 1 Postman)',
      email: 'anbarasan.postman@postmate.internal',
      password: hashedPassword,
      role: UserRole.POSTAL_STAFF,
      officeId: 'PO-600001',
      officeName: 'Anna Nagar Sub Post Office',
      officeType: OfficeType.TOWN,
      phone: '9840123453',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // 3. Central Mail Records
  const now = new Date();
  const todayStr = now.toISOString();
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString();

  const mailRecords = [
    {
      id: 'MAIL-001',
      trackingNumber: 'SP829104812IN',
      direction: MailDirection.INCOMING,
      category: MailCategory.SPEED_POST,
      originOffice: 'New Delhi GPO',
      originPincode: '110001',
      destinationOffice: 'Anna Nagar Sub Post Office',
      destinationPincode: '600040',
      senderName: 'UPSC Recruitment Cell',
      senderAddress: 'Dholpur House, Shahjahan Road, New Delhi 110069',
      senderPhone: '011-23385271',
      recipientName: 'T. Karthikeyan',
      recipientAddress: 'Flat 4B, Shanthi Colony, Anna Nagar, Chennai',
      recipientPhone: '9841029384',
      weightGrams: 120,
      tariffAmount: 41.00,
      receivedDate: todayStr,
      currentStatus: MailStatus.OUT_FOR_DELIVERY,
      assignedStaffId: 'USER-STAFF-02',
      assignedStaffName: 'R. Anbarasan (Beat 1 Postman)',
      assignedStaffEmployeeId: 'PMTS600042',
      sortingArea: 'Beat 1 - Shanthi Colony',
      deliveryAttemptCount: 1,
      lastDeliveryAttemptDate: todayStr,
      statusHistory: [
        {
          status: MailStatus.RECEIVED,
          timestamp: yesterdayStr,
          updatedBy: 'USER-STAFF-01',
          updatedByName: 'V. Murugan',
          notes: 'Received in Mail Bag #TN-CH-409'
        },
        {
          status: MailStatus.SCANNED,
          timestamp: yesterdayStr,
          updatedBy: 'USER-STAFF-01',
          updatedByName: 'V. Murugan',
          notes: 'Scanned and barcode verified'
        },
        {
          status: MailStatus.SORTED,
          timestamp: todayStr,
          updatedBy: 'USER-STAFF-01',
          updatedByName: 'V. Murugan',
          notes: 'Sorted into Beat 1 delivery tray'
        },
        {
          status: MailStatus.OUT_FOR_DELIVERY,
          timestamp: todayStr,
          updatedBy: 'USER-PM-01',
          updatedByName: 'S. Meenakshi Sundaram',
          notes: 'Assigned to R. Anbarasan for delivery'
        }
      ],
      officeId: 'PO-600001',
      createdAt: yesterdayStr,
      updatedAt: todayStr
    },
    {
      id: 'MAIL-002',
      trackingNumber: 'RP930219485IN',
      direction: MailDirection.INCOMING,
      category: MailCategory.REGISTERED_POST,
      originOffice: 'Madurai Head Post Office',
      originPincode: '625001',
      destinationOffice: 'Anna Nagar Sub Post Office',
      destinationPincode: '600040',
      senderName: 'District Revenue Office',
      senderAddress: 'Collectorate Complex, Madurai 625020',
      senderPhone: '0452-2531111',
      recipientName: 'Dr. S. Ramanathan',
      recipientAddress: 'Plot 112, 12th Main Road, Anna Nagar West, Chennai',
      recipientPhone: '9443019283',
      weightGrams: 85,
      tariffAmount: 26.00,
      receivedDate: yesterdayStr,
      currentStatus: MailStatus.DELIVERED,
      assignedStaffId: 'USER-STAFF-02',
      assignedStaffName: 'R. Anbarasan (Beat 1 Postman)',
      assignedStaffEmployeeId: 'PMTS600042',
      sortingArea: 'Beat 1 - Main Roads',
      deliveryAttemptCount: 1,
      lastDeliveryAttemptDate: todayStr,
      deliveredTo: 'Dr. S. Ramanathan',
      deliveredTimestamp: todayStr,
      statusHistory: [
        {
          status: MailStatus.RECEIVED,
          timestamp: yesterdayStr,
          updatedBy: 'USER-STAFF-01',
          updatedByName: 'V. Murugan',
          notes: 'Bag reception verified'
        },
        {
          status: MailStatus.OUT_FOR_DELIVERY,
          timestamp: todayStr,
          updatedBy: 'USER-PM-01',
          updatedByName: 'S. Meenakshi Sundaram',
          notes: 'Assigned to beat'
        },
        {
          status: MailStatus.DELIVERED,
          timestamp: todayStr,
          updatedBy: 'USER-STAFF-02',
          updatedByName: 'R. Anbarasan',
          notes: 'Delivered to Addressee against signature'
        }
      ],
      officeId: 'PO-600001',
      createdAt: yesterdayStr,
      updatedAt: todayStr
    },
    {
      id: 'MAIL-003',
      trackingNumber: 'CP402918239IN',
      direction: MailDirection.INCOMING,
      category: MailCategory.PARCEL,
      originOffice: 'Bengaluru GPO',
      originPincode: '560001',
      destinationOffice: 'Anna Nagar Sub Post Office',
      destinationPincode: '600040',
      senderName: 'FabIndia Crafts Ltd',
      senderAddress: 'Commercial Street, Bengaluru 560042',
      recipientName: 'P. Kavitha',
      recipientAddress: 'Old No. 18, 5th Cross Street, Anna Nagar East, Chennai',
      recipientPhone: '9789012345',
      weightGrams: 1450,
      tariffAmount: 180.00,
      receivedDate: todayStr,
      currentStatus: MailStatus.EXCEPTION,
      assignedStaffId: 'USER-STAFF-02',
      assignedStaffName: 'R. Anbarasan (Beat 1 Postman)',
      assignedStaffEmployeeId: 'PMTS600042',
      deliveryAttemptCount: 1,
      lastDeliveryAttemptDate: todayStr,
      deliveryExceptionReason: DeliveryExceptionReason.DOOR_LOCKED,
      deliveryNotes: 'Premises locked during afternoon attempt. Notice intimation left.',
      statusHistory: [
        {
          status: MailStatus.RECEIVED,
          timestamp: todayStr,
          updatedBy: 'USER-STAFF-01',
          updatedByName: 'V. Murugan',
          notes: 'Parcel received'
        },
        {
          status: MailStatus.OUT_FOR_DELIVERY,
          timestamp: todayStr,
          updatedBy: 'USER-PM-01',
          updatedByName: 'S. Meenakshi Sundaram',
          notes: 'Out for morning delivery beat'
        },
        {
          status: MailStatus.EXCEPTION,
          timestamp: todayStr,
          updatedBy: 'USER-STAFF-02',
          updatedByName: 'R. Anbarasan',
          notes: 'Door Locked. Intimation slip affixed.'
        }
      ],
      officeId: 'PO-600001',
      createdAt: todayStr,
      updatedAt: todayStr
    },
    {
      id: 'MAIL-004',
      trackingNumber: 'SP902184912IN',
      direction: MailDirection.OUTGOING,
      category: MailCategory.SPEED_POST,
      originOffice: 'Anna Nagar Sub Post Office',
      originPincode: '600040',
      destinationOffice: 'Coimbatore Head Post Office',
      destinationPincode: '641001',
      senderName: 'G. Balasubramanian',
      senderAddress: 'Door 28, W-Block, Anna Nagar, Chennai 600040',
      senderPhone: '9840987654',
      recipientName: 'Registrar, Bharathiar University',
      recipientAddress: 'Maruthamalai Road, Coimbatore 641046',
      weightGrams: 210,
      tariffAmount: 64.00,
      receivedDate: todayStr,
      currentStatus: MailStatus.SCANNED,
      statusHistory: [
        {
          status: MailStatus.SCANNED,
          timestamp: todayStr,
          updatedBy: 'USER-STAFF-01',
          updatedByName: 'V. Murugan',
          notes: 'Booked at Counter 1 and sealed in transit bag'
        }
      ],
      officeId: 'PO-600001',
      createdAt: todayStr,
      updatedAt: todayStr
    },
    {
      id: 'MAIL-005',
      trackingNumber: 'MO502918349IN',
      direction: MailDirection.INCOMING,
      category: MailCategory.MONEY_ORDER,
      originOffice: 'Tiruchirappalli Head Post Office',
      originPincode: '620001',
      destinationOffice: 'Anna Nagar Sub Post Office',
      destinationPincode: '600040',
      senderName: 'R. Natarajan',
      senderAddress: 'Cantonment, Trichy 620001',
      recipientName: 'K. Lakshmi Ammal',
      recipientAddress: '15, Anna Nagar Western Extension, Chennai 600040',
      tariffAmount: 2500.00,
      receivedDate: todayStr,
      currentStatus: MailStatus.SORTED,
      assignedStaffId: 'USER-STAFF-02',
      assignedStaffName: 'R. Anbarasan (Beat 1 Postman)',
      sortingArea: 'Beat 1 - Western Extension',
      deliveryAttemptCount: 0,
      statusHistory: [
        {
          status: MailStatus.RECEIVED,
          timestamp: todayStr,
          updatedBy: 'USER-STAFF-01',
          updatedByName: 'V. Murugan',
          notes: 'eMO transmission received & verified'
        },
        {
          status: MailStatus.SORTED,
          timestamp: todayStr,
          updatedBy: 'USER-STAFF-01',
          updatedByName: 'V. Murugan',
          notes: 'Cash voucher tagged for postman beat'
        }
      ],
      officeId: 'PO-600001',
      createdAt: todayStr,
      updatedAt: todayStr
    }
  ];

  // 4. Delivery Assignments
  const deliveryAssignments = [
    {
      id: 'DELIV-001',
      mailId: 'MAIL-001',
      trackingNumber: 'SP829104812IN',
      category: MailCategory.SPEED_POST,
      recipientName: 'T. Karthikeyan',
      recipientAddress: 'Flat 4B, Shanthi Colony, Anna Nagar, Chennai',
      recipientPhone: '9841029384',
      assignedStaffId: 'USER-STAFF-02',
      assignedStaffName: 'R. Anbarasan (Beat 1 Postman)',
      assignedStaffEmployeeId: 'PMTS600042',
      assignedDate: todayStr,
      assignedBy: 'S. Meenakshi Sundaram',
      status: MailStatus.OUT_FOR_DELIVERY,
      deliveryAttemptCount: 1,
      officeId: 'PO-600001',
      createdAt: todayStr,
      updatedAt: todayStr
    },
    {
      id: 'DELIV-002',
      mailId: 'MAIL-002',
      trackingNumber: 'RP930219485IN',
      category: MailCategory.REGISTERED_POST,
      recipientName: 'Dr. S. Ramanathan',
      recipientAddress: 'Plot 112, 12th Main Road, Anna Nagar West, Chennai',
      recipientPhone: '9443019283',
      assignedStaffId: 'USER-STAFF-02',
      assignedStaffName: 'R. Anbarasan (Beat 1 Postman)',
      assignedStaffEmployeeId: 'PMTS600042',
      assignedDate: yesterdayStr,
      assignedBy: 'S. Meenakshi Sundaram',
      status: MailStatus.DELIVERED,
      deliveryAttemptCount: 1,
      deliveredTimestamp: todayStr,
      deliveredTo: 'Dr. S. Ramanathan',
      recipientRelationship: 'Self',
      officeId: 'PO-600001',
      createdAt: yesterdayStr,
      updatedAt: todayStr
    },
    {
      id: 'DELIV-003',
      mailId: 'MAIL-003',
      trackingNumber: 'CP402918239IN',
      category: MailCategory.PARCEL,
      recipientName: 'P. Kavitha',
      recipientAddress: 'Old No. 18, 5th Cross Street, Anna Nagar East, Chennai',
      recipientPhone: '9789012345',
      assignedStaffId: 'USER-STAFF-02',
      assignedStaffName: 'R. Anbarasan (Beat 1 Postman)',
      assignedStaffEmployeeId: 'PMTS600042',
      assignedDate: todayStr,
      assignedBy: 'S. Meenakshi Sundaram',
      status: MailStatus.EXCEPTION,
      deliveryAttemptCount: 1,
      exceptionReason: DeliveryExceptionReason.DOOR_LOCKED,
      exceptionNotes: 'Door locked. Intimation slip placed under door.',
      officeId: 'PO-600001',
      createdAt: todayStr,
      updatedAt: todayStr
    }
  ];

  // 5. Cash Transactions
  const cashTransactions = [
    {
      id: 'TXN-001',
      transactionNumber: 'TXN-20261122-1001',
      date: todayStr,
      type: TransactionType.RECEIPT,
      category: CashCategory.SPEED_POST_BOOKING,
      amount: 64.00,
      description: 'Speed post booking for tracking SP902184912IN',
      relatedTrackingNumber: 'SP902184912IN',
      enteredBy: 'USER-STAFF-01',
      enteredByName: 'V. Murugan',
      isVerified: true,
      verifiedBy: 'USER-PM-01',
      verifiedByName: 'S. Meenakshi Sundaram',
      verifiedAt: todayStr,
      officeId: 'PO-600001',
      createdAt: todayStr,
      updatedAt: todayStr
    },
    {
      id: 'TXN-002',
      transactionNumber: 'TXN-20261122-1002',
      date: todayStr,
      type: TransactionType.RECEIPT,
      category: CashCategory.POSTAGE_STAMPS,
      amount: 450.00,
      description: 'Sale of definitive postage stamps to public counter',
      enteredBy: 'USER-STAFF-01',
      enteredByName: 'V. Murugan',
      isVerified: true,
      verifiedBy: 'USER-PM-01',
      verifiedByName: 'S. Meenakshi Sundaram',
      verifiedAt: todayStr,
      officeId: 'PO-600001',
      createdAt: todayStr,
      updatedAt: todayStr
    },
    {
      id: 'TXN-003',
      transactionNumber: 'TXN-20261122-1003',
      date: todayStr,
      type: TransactionType.RECEIPT,
      category: CashCategory.SAVINGS_BANK_DEPOSIT,
      amount: 5000.00,
      description: 'Post Office Savings Bank deposit Account #SB892019',
      enteredBy: 'USER-STAFF-01',
      enteredByName: 'V. Murugan',
      isVerified: false,
      officeId: 'PO-600001',
      createdAt: todayStr,
      updatedAt: todayStr
    },
    {
      id: 'TXN-004',
      transactionNumber: 'TXN-20261122-1004',
      date: todayStr,
      type: TransactionType.PAYMENT,
      category: CashCategory.OFFICE_EXPENSE,
      amount: 280.00,
      description: 'Purchase of sealing wax and jute string bundles for mail sorting',
      enteredBy: 'USER-STAFF-01',
      enteredByName: 'V. Murugan',
      isVerified: true,
      verifiedBy: 'USER-PM-01',
      verifiedByName: 'S. Meenakshi Sundaram',
      verifiedAt: todayStr,
      officeId: 'PO-600001',
      createdAt: todayStr,
      updatedAt: todayStr
    }
  ];

  // 6. Daily Cash Balance Record
  const dailyBalances = [
    {
      id: 'BAL-20261122-600001',
      date: todayStr.slice(0, 10),
      officeId: 'PO-600001',
      openingBalance: 12500.00,
      totalReceipts: 5514.00,
      totalPayments: 280.00,
      calculatedClosingBalance: 17734.00,
      verifiedPhysicalBalance: 17734.00,
      discrepancyAmount: 0,
      reconciliationStatus: 'RECONCILED',
      reconciledBy: 'USER-PM-01',
      reconciledByName: 'S. Meenakshi Sundaram',
      reconciledAt: todayStr,
      reconciliationNotes: 'Verified against cash chest contents before afternoon dispatch.',
      isClosed: false,
      createdAt: todayStr,
      updatedAt: todayStr
    }
  ];

  // 7. Customer Enquiries
  const enquiries = [
    {
      id: 'ENQ-001',
      enquiryNumber: 'ENQ-20261122-8012',
      trackingNumber: 'CP402918239IN',
      enquiryDate: todayStr,
      customerName: 'P. Kavitha',
      customerPhone: '9789012345',
      customerEmail: 'kavitha.p@example.com',
      enquiryType: 'STATUS_CHECK',
      subject: 'Parcel Delivery Non-Receipt Query',
      description: 'Customer called inquiring about incoming parcel from Bangalore. Informed door locked at 11:30 AM; arranged re-attempt tomorrow.',
      recordedBy: 'USER-STAFF-01',
      recordedByName: 'V. Murugan',
      statusAtEnquiryTime: MailStatus.EXCEPTION,
      mailCategory: MailCategory.PARCEL,
      resolutionStatus: 'IN_PROGRESS',
      resolutionNotes: 'Postman instructed to prioritize delivery tomorrow morning after 10 AM.',
      followUpDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      officeId: 'PO-600001',
      createdAt: todayStr,
      updatedAt: todayStr
    }
  ];

  // 8. Notifications
  const notifications = [
    {
      id: 'NOTIF-001',
      title: 'Delivery Exception: CP402918239IN',
      titleTa: 'விநியோக விதிவிலக்கு: CP402918239IN',
      message: 'Parcel for P. Kavitha was marked DOOR LOCKED by Beat 1 Postman R. Anbarasan.',
      messageTa: 'பி. கவிதாவுக்கான பார்சல் கதவு பூட்டப்பட்டதாக குறிக்கப்பட்டது.',
      type: 'ALERT',
      category: 'DELIVERY',
      relatedId: 'MAIL-003',
      isRead: false,
      targetRole: UserRole.POSTMASTER,
      officeId: 'PO-600001',
      createdAt: todayStr
    },
    {
      id: 'NOTIF-002',
      title: 'Cashbook Ready for Evening Reconciliation',
      titleTa: 'மாலை நேர ரொக்கப்புத்தகம் சரிபார்ப்பிற்கு தயார்',
      message: 'All counter transactions recorded. Opening: Rs. 12,500. Receipts: Rs. 5,514.',
      messageTa: 'அனைத்து கவுண்டர் பரிவர்த்தனைகளும் பதிவு செய்யப்பட்டுள்ளன.',
      type: 'INFO',
      category: 'CASHBOOK',
      isRead: true,
      targetRole: UserRole.POSTMASTER,
      officeId: 'PO-600001',
      createdAt: todayStr
    }
  ];

  // 9. Audit Logs
  const auditLogs = [
    {
      id: 'AUDIT-001',
      timestamp: yesterdayStr,
      userId: 'USER-ADMIN-01',
      userName: 'K. Rajasekaran',
      userRole: 'ADMIN',
      action: 'SYSTEM_INITIALIZED',
      module: 'SYSTEM',
      details: 'POSTMATE operations platform initialized for Anna Nagar Sub Post Office',
      ipAddress: '192.168.1.10',
      officeId: 'PO-600001'
    },
    {
      id: 'AUDIT-002',
      timestamp: todayStr,
      userId: 'USER-STAFF-01',
      userName: 'V. Murugan',
      userRole: 'POSTAL_STAFF',
      action: 'MAIL_REGISTERED',
      module: 'MAIL',
      entityId: 'MAIL-001',
      details: 'Speed Post SP829104812IN scanned and verified into incoming mail register.',
      ipAddress: '192.168.1.14',
      officeId: 'PO-600001'
    }
  ];

  // Set all collections into store
  localStore.setCollection('offices', offices);
  localStore.setCollection('users', users);
  localStore.setCollection('mailRecords', mailRecords);
  localStore.setCollection('deliveryAssignments', deliveryAssignments);
  localStore.setCollection('cashTransactions', cashTransactions);
  localStore.setCollection('dailyBalances', dailyBalances);
  localStore.setCollection('enquiries', enquiries);
  localStore.setCollection('notifications', notifications);
  localStore.setCollection('auditLogs', auditLogs);

  console.log('[POSTMATE Seed] Seed successfully applied! Available login accounts:');
  console.log('  -> Admin: employeeId: ADMIN001 | password: password123');
  console.log('  -> Postmaster: employeeId: PM600040 | password: password123');
  console.log('  -> Postal Assistant: employeeId: PA600041 | password: password123');
  console.log('  -> Delivery Agent: employeeId: PMTS600042 | password: password123');
}

// Allow direct CLI execution: node dist/seed/seedData.js
if (require.main === module) {
  connectDatabase()
    .then(() => seedDatabase())
    .then(() => flushMongoWrites())
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

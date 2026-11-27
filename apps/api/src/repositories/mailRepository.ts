import { localStore } from '../config/database';
import { IMailRecord, MailStatus, MailDirection, MailCategory, MailFilterDto, MailStatusHistoryEntry } from '@postmate/shared';
import { v4 as uuidv4 } from 'uuid';

export class MailRepository {
  static async findById(id: string): Promise<IMailRecord | null> {
    const list: IMailRecord[] = localStore.getCollection('mailRecords');
    return list.find(m => m.id === id) || null;
  }

  static async findByTrackingNumber(trackingNumber: string): Promise<IMailRecord | null> {
    const list: IMailRecord[] = localStore.getCollection('mailRecords');
    return list.find(m => m.trackingNumber.trim().toUpperCase() === trackingNumber.trim().toUpperCase()) || null;
  }

  static async findDuplicates(trackingNumber: string): Promise<IMailRecord[]> {
    const list: IMailRecord[] = localStore.getCollection('mailRecords');
    return list.filter(m => m.trackingNumber.trim().toUpperCase() === trackingNumber.trim().toUpperCase());
  }

  static async create(data: Partial<IMailRecord>): Promise<IMailRecord> {
    const list: IMailRecord[] = localStore.getCollection('mailRecords');
    const newRecord: IMailRecord = {
      id: data.id || uuidv4(),
      trackingNumber: data.trackingNumber!.trim().toUpperCase(),
      direction: data.direction || MailDirection.INCOMING,
      category: data.category || MailCategory.SPEED_POST,
      originOffice: data.originOffice || 'General Post Office',
      originPincode: data.originPincode || '600001',
      destinationOffice: data.destinationOffice || 'Anna Nagar Sub Post Office',
      destinationPincode: data.destinationPincode || '600040',
      senderName: data.senderName || '',
      senderAddress: data.senderAddress || '',
      senderPhone: data.senderPhone || '',
      recipientName: data.recipientName || '',
      recipientAddress: data.recipientAddress || '',
      recipientPhone: data.recipientPhone || '',
      weightGrams: data.weightGrams || 150,
      tariffAmount: data.tariffAmount || 41,
      receivedDate: data.receivedDate || new Date().toISOString(),
      currentStatus: data.currentStatus || MailStatus.RECEIVED,
      deliveryAttemptCount: 0,
      statusHistory: data.statusHistory || [
        {
          status: data.currentStatus || MailStatus.RECEIVED,
          timestamp: new Date().toISOString(),
          updatedBy: data.officeId || 'SYSTEM',
          updatedByName: 'System Entry',
          notes: 'Mail item entered into digital register'
        }
      ],
      officeId: data.officeId || 'PO-600001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };

    list.unshift(newRecord);
    localStore.setCollection('mailRecords', list);
    return newRecord;
  }

  static async update(id: string, updates: Partial<IMailRecord>): Promise<IMailRecord | null> {
    const list: IMailRecord[] = localStore.getCollection('mailRecords');
    const idx = list.findIndex(m => m.id === id);
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    localStore.setCollection('mailRecords', list);
    return list[idx];
  }

  static async addStatusHistory(id: string, entry: MailStatusHistoryEntry): Promise<IMailRecord | null> {
    const record = await this.findById(id);
    if (!record) return null;

    const history = record.statusHistory || [];
    history.push(entry);

    return this.update(id, {
      currentStatus: entry.status,
      statusHistory: history
    });
  }

  static async filter(options: MailFilterDto & { officeId?: string }): Promise<{ items: IMailRecord[]; total: number }> {
    let list: IMailRecord[] = localStore.getCollection('mailRecords');

    if (options.officeId) {
      list = list.filter(m => m.officeId === options.officeId);
    }
    if (options.direction) {
      list = list.filter(m => m.direction === options.direction);
    }
    if (options.category) {
      list = list.filter(m => m.category === options.category);
    }
    if (options.status) {
      list = list.filter(m => m.currentStatus === options.status);
    }
    if (options.assignedStaffId) {
      list = list.filter(m => m.assignedStaffId === options.assignedStaffId);
    }
    if (options.startDate) {
      const startDay = options.startDate.slice(0, 10);
      list = list.filter(m => m.receivedDate.slice(0, 10) >= startDay);
    }
    if (options.endDate) {
      const endDay = options.endDate.slice(0, 10);
      list = list.filter(m => m.receivedDate.slice(0, 10) <= endDay);
    }
    if (options.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(m =>
        m.trackingNumber.toLowerCase().includes(q) ||
        m.recipientName.toLowerCase().includes(q) ||
        m.recipientAddress.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        m.destinationPincode.includes(q)
      );
    }

    const total = list.length;
    const page = Math.max(1, options.page || 1);
    const limit = options.limit || 50;
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit);

    return { items, total };
  }

  static async getRegisterSummary(officeId?: string): Promise<any> {
    let list: IMailRecord[] = localStore.getCollection('mailRecords');
    if (officeId) {
      list = list.filter(m => m.officeId === officeId);
    }

    return {
      totalCount: list.length,
      incomingCount: list.filter(m => m.direction === MailDirection.INCOMING).length,
      outgoingCount: list.filter(m => m.direction === MailDirection.OUTGOING).length,
      speedPostCount: list.filter(m => m.category === MailCategory.SPEED_POST).length,
      registeredPostCount: list.filter(m => m.category === MailCategory.REGISTERED_POST).length,
      parcelCount: list.filter(m => m.category === MailCategory.PARCEL).length,
      ordinaryLetterCount: list.filter(m => m.category === MailCategory.ORDINARY_LETTER).length,
      moneyOrderCount: list.filter(m => m.category === MailCategory.MONEY_ORDER).length,
      pendingCount: list.filter(m => m.currentStatus !== MailStatus.DELIVERED && m.currentStatus !== MailStatus.DISPATCHED).length,
      deliveredCount: list.filter(m => m.currentStatus === MailStatus.DELIVERED).length,
      exceptionCount: list.filter(m => m.currentStatus === MailStatus.EXCEPTION).length
    };
  }
}

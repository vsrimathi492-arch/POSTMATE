import { localStore } from '../config/database';
import { ICustomerEnquiry, CreateEnquiryDto, MailStatus } from '@postmate/shared';
import { v4 as uuidv4 } from 'uuid';

export class EnquiryRepository {
  static async getAll(officeId?: string): Promise<ICustomerEnquiry[]> {
    let list: ICustomerEnquiry[] = localStore.getCollection('enquiries');
    if (officeId) {
      list = list.filter(e => e.officeId === officeId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async findById(id: string): Promise<ICustomerEnquiry | null> {
    const list: ICustomerEnquiry[] = localStore.getCollection('enquiries');
    return list.find(e => e.id === id) || null;
  }

  static async findByTrackingNumber(trackingNumber: string): Promise<ICustomerEnquiry[]> {
    const list: ICustomerEnquiry[] = localStore.getCollection('enquiries');
    const q = trackingNumber.trim().toUpperCase();
    return list.filter(e => e.trackingNumber.trim().toUpperCase() === q);
  }

  static async create(data: Partial<ICustomerEnquiry>): Promise<ICustomerEnquiry> {
    const list: ICustomerEnquiry[] = localStore.getCollection('enquiries');
    const enquiryNumber = `ENQ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newEnquiry: ICustomerEnquiry = {
      id: data.id || uuidv4(),
      enquiryNumber: data.enquiryNumber || enquiryNumber,
      trackingNumber: data.trackingNumber!.trim().toUpperCase(),
      enquiryDate: data.enquiryDate || new Date().toISOString(),
      customerName: data.customerName || 'Customer',
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      enquiryType: data.enquiryType || 'STATUS_CHECK',
      subject: data.subject || 'Delivery Status Check',
      description: data.description || '',
      recordedBy: data.recordedBy || 'SYSTEM',
      recordedByName: data.recordedByName || 'Staff Member',
      statusAtEnquiryTime: data.statusAtEnquiryTime || MailStatus.RECEIVED,
      mailCategory: data.mailCategory,
      resolutionStatus: 'OPEN',
      resolutionNotes: data.resolutionNotes,
      followUpDate: data.followUpDate,
      officeId: data.officeId || 'PO-600001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };

    list.unshift(newEnquiry);
    localStore.setCollection('enquiries', list);
    return newEnquiry;
  }

  static async update(id: string, updates: Partial<ICustomerEnquiry>): Promise<ICustomerEnquiry | null> {
    const list: ICustomerEnquiry[] = localStore.getCollection('enquiries');
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    localStore.setCollection('enquiries', list);
    return list[idx];
  }
}

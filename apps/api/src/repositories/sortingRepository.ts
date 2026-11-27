import { localStore } from '../config/database';
import { ISortingBatch, MailCategory, MailStatus } from '@postmate/shared';
import { v4 as uuidv4 } from 'uuid';

export class SortingRepository {
  static async getAll(officeId?: string): Promise<ISortingBatch[]> {
    let list: ISortingBatch[] = localStore.getCollection('sortingBatches');
    if (officeId) {
      list = list.filter(b => b.officeId === officeId);
    }
    return list;
  }

  static async findById(id: string): Promise<ISortingBatch | null> {
    const list: ISortingBatch[] = localStore.getCollection('sortingBatches');
    return list.find(b => b.id === id) || null;
  }

  static async create(data: Partial<ISortingBatch>): Promise<ISortingBatch> {
    const list: ISortingBatch[] = localStore.getCollection('sortingBatches');
    const batchNumber = `SORT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBatch: ISortingBatch = {
      id: data.id || uuidv4(),
      batchNumber: data.batchNumber || batchNumber,
      officeId: data.officeId || 'PO-600001',
      destinationArea: data.destinationArea || 'Anna Nagar West',
      destinationPincodes: data.destinationPincodes || ['600040'],
      category: data.category,
      mailItemIds: data.mailItemIds || [],
      totalItems: data.mailItemIds?.length || 0,
      verifiedItems: 0,
      status: 'OPEN',
      assignedStaffId: data.assignedStaffId,
      assignedStaffName: data.assignedStaffName,
      createdBy: data.createdBy || 'SYSTEM',
      createdByName: data.createdByName || 'Staff Member',
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    list.unshift(newBatch);
    localStore.setCollection('sortingBatches', list);
    return newBatch;
  }

  static async update(id: string, updates: Partial<ISortingBatch>): Promise<ISortingBatch | null> {
    const list: ISortingBatch[] = localStore.getCollection('sortingBatches');
    const idx = list.findIndex(b => b.id === id);
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    localStore.setCollection('sortingBatches', list);
    return list[idx];
  }
}

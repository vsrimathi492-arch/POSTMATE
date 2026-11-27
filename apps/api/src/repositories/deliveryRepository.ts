import { localStore } from '../config/database';
import { IDeliveryAssignment, MailStatus, DeliveryExceptionReason } from '@postmate/shared';
import { v4 as uuidv4 } from 'uuid';

export class DeliveryRepository {
  static async getAll(officeId?: string): Promise<IDeliveryAssignment[]> {
    let list: IDeliveryAssignment[] = localStore.getCollection('deliveryAssignments');
    if (officeId) {
      list = list.filter(d => d.officeId === officeId);
    }
    return list;
  }

  static async findById(id: string): Promise<IDeliveryAssignment | null> {
    const list: IDeliveryAssignment[] = localStore.getCollection('deliveryAssignments');
    return list.find(d => d.id === id) || null;
  }

  static async findByMailId(mailId: string): Promise<IDeliveryAssignment | null> {
    const list: IDeliveryAssignment[] = localStore.getCollection('deliveryAssignments');
    return list.find(d => d.mailId === mailId) || null;
  }

  static async findByStaffId(staffId: string, status?: MailStatus): Promise<IDeliveryAssignment[]> {
    const list: IDeliveryAssignment[] = localStore.getCollection('deliveryAssignments');
    return list.filter(d => {
      if (d.assignedStaffId !== staffId) return false;
      if (status && d.status !== status) return false;
      return true;
    });
  }

  static async create(data: Partial<IDeliveryAssignment>): Promise<IDeliveryAssignment> {
    const list: IDeliveryAssignment[] = localStore.getCollection('deliveryAssignments');
    const newAssignment: IDeliveryAssignment = {
      id: data.id || uuidv4(),
      mailId: data.mailId!,
      trackingNumber: data.trackingNumber!,
      category: data.category!,
      recipientName: data.recipientName!,
      recipientAddress: data.recipientAddress!,
      recipientPhone: data.recipientPhone,
      assignedStaffId: data.assignedStaffId!,
      assignedStaffName: data.assignedStaffName!,
      assignedStaffEmployeeId: data.assignedStaffEmployeeId || '',
      assignedDate: data.assignedDate || new Date().toISOString(),
      assignedBy: data.assignedBy || 'POSTMASTER',
      status: data.status || MailStatus.OUT_FOR_DELIVERY,
      deliveryAttemptCount: 1,
      officeId: data.officeId || 'PO-600001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };

    list.unshift(newAssignment);
    localStore.setCollection('deliveryAssignments', list);
    return newAssignment;
  }

  static async update(id: string, updates: Partial<IDeliveryAssignment>): Promise<IDeliveryAssignment | null> {
    const list: IDeliveryAssignment[] = localStore.getCollection('deliveryAssignments');
    const idx = list.findIndex(d => d.id === id);
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    localStore.setCollection('deliveryAssignments', list);
    return list[idx];
  }

  static async getSummary(officeId?: string): Promise<any> {
    let list: IDeliveryAssignment[] = localStore.getCollection('deliveryAssignments');
    if (officeId) {
      list = list.filter(d => d.officeId === officeId);
    }

    const totalAssigned = list.length;
    const delivered = list.filter(d => d.status === MailStatus.DELIVERED).length;
    const exceptions = list.filter(d => d.status === MailStatus.EXCEPTION).length;
    const outForDelivery = list.filter(d => d.status === MailStatus.OUT_FOR_DELIVERY).length;
    const pending = totalAssigned - delivered;

    // Staff breakdown
    const staffMap = new Map<string, { staffId: string; staffName: string; assignedCount: number; deliveredCount: number; exceptionCount: number }>();
    list.forEach(d => {
      const entry = staffMap.get(d.assignedStaffId) || {
        staffId: d.assignedStaffId,
        staffName: d.assignedStaffName,
        assignedCount: 0,
        deliveredCount: 0,
        exceptionCount: 0
      };
      entry.assignedCount++;
      if (d.status === MailStatus.DELIVERED) entry.deliveredCount++;
      if (d.status === MailStatus.EXCEPTION) entry.exceptionCount++;
      staffMap.set(d.assignedStaffId, entry);
    });

    const staffDistribution = Array.from(staffMap.values()).map(s => ({
      ...s,
      completionRate: s.assignedCount > 0 ? Math.round((s.deliveredCount / s.assignedCount) * 100) : 0
    }));

    return {
      totalAssigned,
      outForDelivery,
      delivered,
      exceptions,
      pending,
      staffDistribution
    };
  }
}

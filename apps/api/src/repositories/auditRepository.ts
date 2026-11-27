import { localStore } from '../config/database';
import { IAuditLog } from '@postmate/shared';
import { v4 as uuidv4 } from 'uuid';

export class AuditRepository {
  static async getAll(officeId?: string, module?: string): Promise<IAuditLog[]> {
    let list: IAuditLog[] = localStore.getCollection('auditLogs');
    if (officeId) {
      list = list.filter(a => a.officeId === officeId);
    }
    if (module) {
      list = list.filter(a => a.module === module);
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static async log(data: {
    userId: string;
    userName: string;
    userRole: string;
    action: string;
    module: IAuditLog['module'];
    entityId?: string;
    details: string;
    ipAddress?: string;
    officeId?: string;
  }): Promise<IAuditLog> {
    const list: IAuditLog[] = localStore.getCollection('auditLogs');
    const entry: IAuditLog = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      userId: data.userId || 'SYSTEM',
      userName: data.userName || 'System Action',
      userRole: data.userRole || 'SYSTEM',
      action: data.action,
      module: data.module,
      entityId: data.entityId,
      details: data.details,
      ipAddress: data.ipAddress || '127.0.0.1',
      officeId: data.officeId || 'PO-600001'
    };

    list.unshift(entry);
    localStore.setCollection('auditLogs', list);
    return entry;
  }
}

import { localStore } from '../config/database';
import { INotification } from '@postmate/shared';
import { v4 as uuidv4 } from 'uuid';

export class NotificationRepository {
  static async getAll(officeId?: string, role?: string, userId?: string): Promise<INotification[]> {
    let list: INotification[] = localStore.getCollection('notifications');
    if (officeId) {
      list = list.filter(n => !n.officeId || n.officeId === officeId);
    }
    if (role) {
      list = list.filter(n => !n.targetRole || n.targetRole === role || n.targetRole === 'ALL');
    }
    if (userId) {
      list = list.filter(n => !n.targetUserId || n.targetUserId === userId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async create(data: Partial<INotification>): Promise<INotification> {
    const list: INotification[] = localStore.getCollection('notifications');
    const newNotice: INotification = {
      id: data.id || uuidv4(),
      title: data.title!,
      titleTa: data.titleTa,
      message: data.message!,
      messageTa: data.messageTa,
      type: data.type || 'INFO',
      category: data.category || 'GENERAL',
      relatedId: data.relatedId,
      isRead: false,
      createdAt: new Date().toISOString(),
      targetRole: data.targetRole,
      targetUserId: data.targetUserId,
      officeId: data.officeId || 'PO-600001',
      ...data
    };

    list.unshift(newNotice);
    localStore.setCollection('notifications', list);
    return newNotice;
  }

  static async markAsRead(id: string): Promise<INotification | null> {
    const list: INotification[] = localStore.getCollection('notifications');
    const idx = list.findIndex(n => n.id === id);
    if (idx === -1) return null;

    list[idx] = { ...list[idx], isRead: true };
    localStore.setCollection('notifications', list);
    return list[idx];
  }

  static async markAllAsRead(officeId?: string): Promise<void> {
    const list: INotification[] = localStore.getCollection('notifications');
    list.forEach(n => {
      if (!officeId || n.officeId === officeId) {
        n.isRead = true;
      }
    });
    localStore.setCollection('notifications', list);
  }
}

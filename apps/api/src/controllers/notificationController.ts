import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { NotificationRepository } from '../repositories/notificationRepository';

export class NotificationController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const officeId = req.user?.officeId;
      const role = req.user?.role;
      const userId = req.user?.id;

      const notifications = await NotificationRepository.getAll(officeId, role, userId);
      const unreadCount = notifications.filter(n => !n.isRead).length;

      return res.json({ success: true, notifications, unreadCount });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async markRead(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updated = await NotificationRepository.markAsRead(id);
      return res.json({ success: true, notification: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async markAllRead(req: AuthenticatedRequest, res: Response) {
    try {
      await NotificationRepository.markAllAsRead(req.user?.officeId);
      return res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

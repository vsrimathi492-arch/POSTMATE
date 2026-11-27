import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AutomationEngine } from '../services/automationEngine';
import { MailRepository } from '../repositories/mailRepository';
import { CashbookRepository } from '../repositories/cashbookRepository';
import { SyncBatchRequest, SyncBatchResponse, SyncStatus, SyncConflict, MailStatus } from '@postmate/shared';
import { AuditRepository } from '../repositories/auditRepository';

export class SyncController {
  static async syncBatch(req: AuthenticatedRequest, res: Response) {
    try {
      const { deviceId, items }: SyncBatchRequest = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ success: false, message: 'Valid queue items array is required.' });
      }

      const results: SyncBatchResponse['results'] = [];
      const conflicts: SyncConflict[] = [];
      let syncedCount = 0;
      let failedCount = 0;

      for (const item of items) {
        try {
          if (item.action === 'CREATE_MAIL') {
            const { mail, isDuplicate, duplicateRecord } = await AutomationEngine.processNewMailEntry(
              item.payload,
              req.user!
            );

            if (isDuplicate) {
              conflicts.push({
                localId: item.localId,
                entityId: duplicateRecord?.id || item.payload.trackingNumber,
                entityType: 'MAIL',
                serverVersion: duplicateRecord,
                localVersion: item.payload,
                conflictReason: 'Mail item already registered on server during offline interval'
              });
              results.push({
                localId: item.localId,
                serverId: duplicateRecord?.id || '',
                status: SyncStatus.CONFLICT,
                error: 'Duplicate tracking registration'
              });
            } else {
              syncedCount++;
              results.push({
                localId: item.localId,
                serverId: mail.id,
                status: SyncStatus.SYNCED
              });
            }
          } else if (item.action === 'UPDATE_DELIVERY') {
            const { mailId, status, details } = item.payload;
            const existingMail = await MailRepository.findById(mailId);

            // Conflict Check: If server mail is already marked final (DELIVERED) and local update is older
            if (existingMail && existingMail.currentStatus === MailStatus.DELIVERED && status !== MailStatus.DELIVERED) {
              conflicts.push({
                localId: item.localId,
                entityId: mailId,
                entityType: 'DELIVERY',
                serverVersion: existingMail,
                localVersion: item.payload,
                conflictReason: 'Item was already recorded as DELIVERED by another terminal'
              });
              results.push({
                localId: item.localId,
                serverId: mailId,
                status: SyncStatus.CONFLICT,
                error: 'Server record has higher precedence terminal state'
              });
            } else {
              const updated = await AutomationEngine.updateDeliveryStatus(
                mailId,
                status,
                details || {},
                req.user!
              );
              syncedCount++;
              results.push({
                localId: item.localId,
                serverId: mailId,
                status: SyncStatus.SYNCED
              });
            }
          } else if (item.action === 'CREATE_CASH_TRANSACTION') {
            const tx = await CashbookRepository.createTransaction({
              ...item.payload,
              enteredBy: req.user!.id,
              enteredByName: req.user!.name,
              officeId: req.user?.officeId
            });
            syncedCount++;
            results.push({
              localId: item.localId,
              serverId: tx.id,
              status: SyncStatus.SYNCED
            });
          } else {
            failedCount++;
            results.push({
              localId: item.localId,
              serverId: '',
              status: SyncStatus.FAILED,
              error: `Unsupported action: ${item.action}`
            });
          }
        } catch (itemErr: any) {
          failedCount++;
          results.push({
            localId: item.localId,
            serverId: '',
            status: SyncStatus.FAILED,
            error: itemErr.message
          });
        }
      }

      await AuditRepository.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'MOBILE_OFFLINE_SYNC',
        module: 'SYSTEM',
        details: `Mobile batch sync from device ${deviceId || 'Mobile-App'}: ${syncedCount} synced, ${conflicts.length} conflicts, ${failedCount} failed.`,
        officeId: req.user?.officeId
      });

      const response: SyncBatchResponse = {
        success: conflicts.length === 0 && failedCount === 0,
        syncedCount,
        failedCount,
        conflicts,
        results
      };

      return res.json(response);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

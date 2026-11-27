import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { MailRepository } from '../repositories/mailRepository';
import { SortingRepository } from '../repositories/sortingRepository';
import { MailStatus, MailCategory } from '@postmate/shared';
import { AuditRepository } from '../repositories/auditRepository';

export class SortingController {
  /**
   * Group unsorted or scanned mail by destination area, pincode, and category
   */
  static async getGroupingSuggestions(req: AuthenticatedRequest, res: Response) {
    try {
      const officeId = req.user?.officeId;
      const groupBy = (req.query.groupBy as string) === 'category' ? 'category' : 'destination';
      const { items: allMail } = await MailRepository.filter({
        officeId,
        limit: 1000
      });

      // Filter items ready for sorting
      const unassignedItems = allMail.filter(
        m => m.currentStatus === MailStatus.SCANNED || m.currentStatus === MailStatus.RECEIVED
      );

      // Group by destination area/pincode OR category
      const areaGroups: Record<string, any> = {};

      unassignedItems.forEach(item => {
        const hasAmbiguousInfo = !item.destinationPincode || item.destinationPincode.length < 6 || !item.sortingArea;
        const areaKey =
          groupBy === 'category'
            ? item.category
            : (item.sortingArea || item.destinationPincode || 'Unassigned Area');

        if (!areaGroups[areaKey]) {
          areaGroups[areaKey] = {
            groupKey: areaKey,
            groupType: groupBy,
            destinationArea:
              groupBy === 'category'
                ? `${item.category.replace(/_/g, ' ')} Batch`
                : (item.sortingArea || (item.destinationPincode ? `Pincode ${item.destinationPincode}` : 'Verification Required')),
            pincode: item.destinationPincode || 'UNKNOWN',
            category: groupBy === 'category' ? item.category : undefined,
            needsVerification: false,
            totalItems: 0,
            categories: {
              [MailCategory.SPEED_POST]: 0,
              [MailCategory.REGISTERED_POST]: 0,
              [MailCategory.PARCEL]: 0,
              [MailCategory.ORDINARY_LETTER]: 0,
              [MailCategory.BOOK_POST]: 0,
              [MailCategory.MONEY_ORDER]: 0
            },
            items: []
          };
        }

        areaGroups[areaKey].totalItems++;
        if (hasAmbiguousInfo) {
          areaGroups[areaKey].needsVerification = true;
        }
        if (areaGroups[areaKey].categories[item.category] !== undefined) {
          areaGroups[areaKey].categories[item.category]++;
        }
        areaGroups[areaKey].items.push({
          id: item.id,
          trackingNumber: item.trackingNumber,
          category: item.category,
          recipientName: item.recipientName,
          recipientAddress: item.recipientAddress,
          destinationPincode: item.destinationPincode,
          sortingArea: item.sortingArea,
          weightGrams: item.weightGrams,
          needsVerification: hasAmbiguousInfo
        });
      });

      return res.json({
        success: true,
        groupBy,
        totalUnsorted: unassignedItems.length,
        groups: Object.values(areaGroups)
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async listBatches(req: AuthenticatedRequest, res: Response) {
    try {
      const batches = await SortingRepository.getAll(req.user?.officeId);
      return res.json({ success: true, batches });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createBatch(req: AuthenticatedRequest, res: Response) {
    try {
      const { destinationArea, destinationPincodes, category, mailItemIds, notes } = req.body;
      if (!destinationArea || !mailItemIds || mailItemIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Destination area and at least one mail item are required.' });
      }

      const batch = await SortingRepository.create({
        destinationArea,
        destinationPincodes: destinationPincodes || [],
        category,
        mailItemIds,
        officeId: req.user?.officeId,
        createdBy: req.user!.id,
        createdByName: req.user!.name,
        notes
      });

      // Update status of included mail items to SORTED
      for (const id of mailItemIds) {
        await MailRepository.update(id, {
          sortingBatchId: batch.id,
          sortingArea: destinationArea,
          currentStatus: MailStatus.SORTED
        });
        await MailRepository.addStatusHistory(id, {
          status: MailStatus.SORTED,
          timestamp: new Date().toISOString(),
          updatedBy: req.user!.id,
          updatedByName: req.user!.name,
          notes: `Sorted into Batch ${batch.batchNumber} (${destinationArea})`
        });
      }

      await AuditRepository.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'SORTING_BATCH_CREATED',
        module: 'SORTING',
        entityId: batch.id,
        details: `Batch ${batch.batchNumber} created with ${mailItemIds.length} items for ${destinationArea}`,
        officeId: req.user?.officeId
      });

      return res.status(201).json({ success: true, batch });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateBatchStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, verifiedItems, notes } = req.body;
      const existing = await SortingRepository.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Sorting batch not found.' });
      }

      const updated = await SortingRepository.update(id, {
        status,
        verifiedItems: verifiedItems !== undefined ? verifiedItems : existing.totalItems,
        notes
      });

      await AuditRepository.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'SORTING_BATCH_UPDATED',
        module: 'SORTING',
        entityId: id,
        details: `Batch ${existing.batchNumber} status updated to ${status || existing.status}`,
        officeId: req.user?.officeId
      });

      return res.json({ success: true, batch: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

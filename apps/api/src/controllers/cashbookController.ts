import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { CashbookRepository } from '../repositories/cashbookRepository';
import { AuditRepository } from '../repositories/auditRepository';
import { NotificationRepository } from '../repositories/notificationRepository';
import { TransactionType } from '@postmate/shared';

export class CashbookController {
  static async getTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      const { date } = req.query;
      const officeId = req.user?.officeId;
      const transactions = await CashbookRepository.getTransactions(officeId, date as string);
      return res.json({ success: true, transactions });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getDailyBalance(req: AuthenticatedRequest, res: Response) {
    try {
      const officeId = req.user?.officeId || 'PO-600001';
      const date = (req.query.date as string) || new Date().toISOString();
      const balance = await CashbookRepository.recalculateDailyBalance(officeId, date);
      return res.json({ success: true, balance });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const { date, type, category, amount, description, relatedTrackingNumber } = req.body;

      if (!type || !category || amount === undefined) {
        return res.status(400).json({ success: false, message: 'Type, category and amount are required.' });
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a positive number greater than zero.' });
      }

      const transaction = await CashbookRepository.createTransaction({
        date: date || new Date().toISOString(),
        type,
        category,
        amount: numAmount,
        description: description || `Operational ${type} for ${category}`,
        relatedTrackingNumber,
        enteredBy: req.user!.id,
        enteredByName: req.user!.name,
        officeId: req.user?.officeId
      });

      await AuditRepository.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'CASH_TRANSACTION_CREATED',
        module: 'CASHBOOK',
        entityId: transaction.id,
        details: `${transaction.transactionNumber}: ${type} of Rs. ${numAmount} recorded under ${category}.`,
        officeId: req.user?.officeId
      });

      return res.status(201).json({
        success: true,
        message: 'Transaction saved and daily balance auto-updated.',
        transaction
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async verifyTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const verified = await CashbookRepository.verifyTransaction(id, req.user!.id, req.user!.name);
      if (!verified) {
        return res.status(404).json({ success: false, message: 'Transaction not found.' });
      }

      await AuditRepository.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'CASH_TRANSACTION_VERIFIED',
        module: 'CASHBOOK',
        entityId: id,
        details: `Transaction ${verified.transactionNumber} verified by Postmaster ${req.user!.name}`,
        officeId: req.user?.officeId
      });

      return res.json({ success: true, transaction: verified });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async reconcile(req: AuthenticatedRequest, res: Response) {
    try {
      const { date, verifiedPhysicalBalance, notes } = req.body;
      if (verifiedPhysicalBalance === undefined || isNaN(Number(verifiedPhysicalBalance))) {
        return res.status(400).json({ success: false, message: 'Verified physical balance amount is required.' });
      }

      const officeId = req.user?.officeId || 'PO-600001';
      const day = date || new Date().toISOString();

      const reconciled = await CashbookRepository.reconcile(
        officeId,
        day,
        Number(verifiedPhysicalBalance),
        req.user!.id,
        req.user!.name,
        notes
      );

      await AuditRepository.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'CASHBOOK_RECONCILED',
        module: 'CASHBOOK',
        entityId: reconciled.id,
        details: `Cashbook for ${reconciled.date} reconciled. Physical Cash: Rs. ${verifiedPhysicalBalance}. Discrepancy: Rs. ${reconciled.discrepancyAmount || 0}.`,
        officeId
      });

      if (reconciled.discrepancyAmount !== 0) {
        await NotificationRepository.create({
          title: `Cash Discrepancy Noted: Rs. ${reconciled.discrepancyAmount}`,
          titleTa: `பண வேறுபாடு கண்டறியப்பட்டது: ரூ. ${reconciled.discrepancyAmount}`,
          message: `Physical chest balance differs from calculated ledger balance for ${reconciled.date}.`,
          messageTa: `கணக்கிடப்பட்ட இருப்பிற்கும் பெட்டக இருப்புக்கும் வேறுபாடு உள்ளது.`,
          type: 'ALERT',
          category: 'CASHBOOK',
          relatedId: reconciled.id,
          targetRole: 'POSTMASTER',
          officeId
        });
      }

      return res.json({
        success: true,
        message: reconciled.discrepancyAmount === 0
          ? 'Cashbook successfully verified and reconciled. Zero discrepancy.'
          : `Cashbook reconciled with discrepancy of Rs. ${reconciled.discrepancyAmount}. Audit alert logged.`,
        balance: reconciled
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

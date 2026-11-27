import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ReportRepository } from '../repositories/reportRepository';
import { AutomationEngine } from '../services/automationEngine';
import { PdfService } from '../services/pdfService';
import { AuditRepository } from '../repositories/auditRepository';
import { ReportType } from '@postmate/shared';

export class ReportController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const officeId = req.user?.officeId;
      const reports = await ReportRepository.getAll(officeId);
      return res.json({ success: true, reports });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const report = await ReportRepository.findById(id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found.' });
      }
      return res.json({ success: true, report });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Automatic report compilation from live verified records
   */
  static async generate(req: AuthenticatedRequest, res: Response) {
    try {
      const { date, reportType } = req.body;
      const day = date || new Date().toISOString().slice(0, 10);
      const officeId = req.user?.officeId || 'PO-600001';

      const report = await AutomationEngine.compileDailyOperationsReport(
        officeId,
        day,
        { id: req.user!.id, name: req.user!.name },
        reportType as ReportType | undefined
      );

      await AuditRepository.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'REPORT_GENERATED',
        module: 'REPORT',
        entityId: report.id,
        details: `Daily operations report automatically compiled for ${day} without manual re-entry.`,
        officeId
      });

      return res.json({
        success: true,
        message: 'Daily report automatically generated from central database records.',
        report
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async approve(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const approved = await ReportRepository.approve(id, req.user!.id, req.user!.name);
      if (!approved) {
        return res.status(404).json({ success: false, message: 'Report not found.' });
      }

      await AuditRepository.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'REPORT_APPROVED',
        module: 'REPORT',
        entityId: id,
        details: `Daily operations report ${id} verified and approved by Postmaster ${req.user!.name}`,
        officeId: req.user?.officeId
      });

      return res.json({
        success: true,
        message: 'Daily operations report officially approved.',
        report: approved
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async downloadPdf(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      let report = await ReportRepository.findById(id);

      if (!report) {
        // Compile on-the-fly if not already stored
        const officeId = req.user?.officeId || 'PO-600001';
        report = await AutomationEngine.compileDailyOperationsReport(
          officeId,
          new Date().toISOString().slice(0, 10),
          { id: req.user!.id, name: req.user!.name }
        );
      }

      const pdfBuffer = await PdfService.generateDailyReport(report);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=POSTMATE_Report_${report.reportDate}.pdf`);
      return res.send(pdfBuffer);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

import { localStore } from '../config/database';
import { DailyOperationsReport, ReportType } from '@postmate/shared';
import { v4 as uuidv4 } from 'uuid';

export class ReportRepository {
  static async getAll(officeId?: string): Promise<DailyOperationsReport[]> {
    let list: DailyOperationsReport[] = localStore.getCollection('dailyReports');
    if (officeId) {
      list = list.filter(r => r.officeId === officeId);
    }
    return list.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  static async findById(id: string): Promise<DailyOperationsReport | null> {
    const list: DailyOperationsReport[] = localStore.getCollection('dailyReports');
    return list.find(r => r.id === id) || null;
  }

  static async findByDateAndType(officeId: string, date: string, type: ReportType): Promise<DailyOperationsReport | null> {
    const list: DailyOperationsReport[] = localStore.getCollection('dailyReports');
    return list.find(r => r.officeId === officeId && r.reportDate.slice(0, 10) === date.slice(0, 10) && r.reportType === type) || null;
  }

  static async save(report: Partial<DailyOperationsReport>): Promise<DailyOperationsReport> {
    const list: DailyOperationsReport[] = localStore.getCollection('dailyReports');
    const existingIdx = list.findIndex(r => r.id === report.id);

    const fullReport: DailyOperationsReport = {
      id: report.id || uuidv4(),
      reportDate: report.reportDate || new Date().toISOString().slice(0, 10),
      reportType: report.reportType || ReportType.DAILY_OPERATIONS,
      officeId: report.officeId || 'PO-600001',
      officeName: report.officeName || 'Anna Nagar Sub Post Office',
      officeCode: report.officeCode || 'PO-600001',
      generatedAt: new Date().toISOString(),
      generatedBy: report.generatedBy || 'SYSTEM',
      generatedByName: report.generatedByName || 'Postmaster',
      isApproved: report.isApproved || false,
      mailSummary: report.mailSummary!,
      deliverySummary: report.deliverySummary!,
      cashSummary: report.cashSummary!,
      staffSummary: report.staffSummary!,
      remarks: report.remarks
    };

    if (existingIdx !== -1) {
      list[existingIdx] = fullReport;
    } else {
      list.unshift(fullReport);
    }

    localStore.setCollection('dailyReports', list);
    return fullReport;
  }

  static async approve(id: string, approvedBy: string, approvedByName: string): Promise<DailyOperationsReport | null> {
    const list: DailyOperationsReport[] = localStore.getCollection('dailyReports');
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      isApproved: true,
      approvedBy,
      approvedByName,
      approvedAt: new Date().toISOString()
    };

    localStore.setCollection('dailyReports', list);
    return list[idx];
  }
}

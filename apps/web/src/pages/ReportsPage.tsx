import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ReportType, UserRole } from '@postmate/shared';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Printer,
  Calendar,
  Sparkles,
  ShieldCheck,
  Building2,
  RefreshCw
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [reports, setReports] = useState<any[]>([]);
  const [currentReport, setCurrentReport] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reportType, setReportType] = useState<ReportType>(ReportType.DAILY_OPERATIONS);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canApprove = user?.role === UserRole.POSTMASTER || user?.role === UserRole.ADMIN;

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.getReports();
      if (res.success) {
        setReports(res.reports || []);
        if (res.reports?.length > 0) {
          setCurrentReport(res.reports[0]);
        } else {
          handleGenerate();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setErrorMsg(null);
    try {
      const res = await api.generateReport(selectedDate, reportType);
      if (res.success) {
        setCurrentReport(res.report);
        const listRes = await api.getReports();
        if (listRes.success) setReports(listRes.reports || []);
      } else {
        setErrorMsg(res.message || 'Failed to generate report.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!currentReport) return;
    setApproving(true);
    setErrorMsg(null);
    try {
      const res = await api.approveReport(currentReport.id);
      if (res.success) {
        setCurrentReport(res.report);
        setReports(prev => prev.map(r => (r.id === res.report.id ? res.report : r)));
      } else {
        setErrorMsg(res.message || 'Approval denied.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Approval failed.');
    } finally {
      setApproving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!currentReport) return;
    setDownloadingPdf(true);
    setErrorMsg(null);
    try {
      await api.downloadReportPdf(
        currentReport.id,
        `POSTMATE_${currentReport.reportType}_${currentReport.reportDate}.pdf`
      );
    } catch (e: any) {
      setErrorMsg(e.message || 'PDF download failed.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 no-print">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.reports.title}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Single-click aggregation from verified database records — Never re-enter already recorded operational data
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold text-slate-700 focus:outline-none"
            />
          </div>

          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700"
          >
            <option value={ReportType.DAILY_OPERATIONS}>Daily Operations Report</option>
            <option value={ReportType.INCOMING_MAIL}>Incoming Mail Report</option>
            <option value={ReportType.OUTGOING_MAIL}>Outgoing Mail Report</option>
            <option value={ReportType.PENDING_MAIL}>Pending Mail Report</option>
            <option value={ReportType.DELIVERY_SUMMARY}>Delivery Report</option>
            <option value={ReportType.STAFF_WORKLOAD}>Staff Workload Report</option>
            <option value={ReportType.CASH_TRANSACTION}>Cash Transaction Report</option>
            <option value={ReportType.MONTHLY_SUMMARY}>Monthly Summary Report</option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{generating ? 'Compiling...' : t.reports.generateBtn}</span>
          </button>

          {currentReport && (
            <>
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingPdf ? 'Exporting...' : t.reports.downloadPdf}</span>
              </button>

              <button
                onClick={handlePrint}
                className="p-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
                title="Print Preview"
              >
                <Printer className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold no-print">
          {errorMsg}
        </div>
      )}

      {/* Compiled Reports Selector Strip */}
      {reports.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-print">
          <span className="text-[11px] font-bold text-slate-500 uppercase flex-shrink-0">Compiled Reports:</span>
          {reports.slice(0, 8).map((r) => (
            <button
              key={r.id}
              onClick={() => setCurrentReport(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex-shrink-0 ${
                currentReport?.id === r.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {r.reportType.replace(/_/g, ' ')} • {r.reportDate}
            </button>
          ))}
        </div>
      )}

      {currentReport && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
          {/* Printable Report Header */}
          <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-black text-xl tracking-tight text-slate-950">POSTMATE</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300">
                  OFFICIAL RECORD
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 uppercase">
                {currentReport.reportType?.replace(/_/g, ' ') || 'DAILY POSTAL OPERATIONS'} SUMMARY
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Office: <strong>{currentReport.officeName}</strong> ({currentReport.officeCode}) • Date: <strong>{currentReport.reportDate}</strong>
              </p>
            </div>

            <div className="text-right text-xs">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs ${
                currentReport.isApproved
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {currentReport.isApproved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>APPROVED</span>
                  </>
                ) : (
                  <span>PENDING APPROVAL</span>
                )}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">
                Generated: {new Date(currentReport.generatedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* 1. Mail Operations Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
              1. Mail Operations & Sorting Volume
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Incoming Mail</span>
                <span className="text-xl font-bold text-slate-900 block mt-1">{currentReport.mailSummary.totalIncoming}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Outgoing Mail</span>
                <span className="text-xl font-bold text-slate-900 block mt-1">{currentReport.mailSummary.totalOutgoing}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Processed & Sorted</span>
                <span className="text-xl font-bold text-slate-900 block mt-1">{currentReport.mailSummary.totalSorted}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Sorting</span>
                <span className="text-xl font-bold text-amber-600 block mt-1">{currentReport.mailSummary.pendingSorting}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2">
              <div className="flex justify-between px-2 py-1 bg-slate-50 rounded">
                <span className="text-slate-500">Speed Post:</span>
                <span className="font-bold">{currentReport.mailSummary.categoryBreakdown.speedPost}</span>
              </div>
              <div className="flex justify-between px-2 py-1 bg-slate-50 rounded">
                <span className="text-slate-500">Reg Post:</span>
                <span className="font-bold">{currentReport.mailSummary.categoryBreakdown.registeredPost}</span>
              </div>
              <div className="flex justify-between px-2 py-1 bg-slate-50 rounded">
                <span className="text-slate-500">Parcels:</span>
                <span className="font-bold">{currentReport.mailSummary.categoryBreakdown.parcel}</span>
              </div>
              <div className="flex justify-between px-2 py-1 bg-slate-50 rounded">
                <span className="text-slate-500">Money Orders:</span>
                <span className="font-bold">{currentReport.mailSummary.categoryBreakdown.moneyOrder}</span>
              </div>
            </div>
          </div>

          {/* 2. Delivery Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
              2. Beat Delivery Performance
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Items</span>
                <span className="text-xl font-bold text-slate-900 block mt-1">{currentReport.deliverySummary.totalAssignedForDelivery}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Delivered Today</span>
                <span className="text-xl font-bold text-emerald-700 block mt-1">{currentReport.deliverySummary.deliveredToday}</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-[10px] font-bold text-rose-600 uppercase">Exceptions / Locked</span>
                <span className="text-xl font-bold text-rose-700 block mt-1">{currentReport.deliverySummary.deliveryExceptions}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-[10px] font-bold text-blue-600 uppercase">Success Rate</span>
                <span className="text-xl font-bold text-blue-700 block mt-1">{currentReport.deliverySummary.deliverySuccessRate}%</span>
              </div>
            </div>
          </div>

          {/* 3. Cashbook Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
              3. Cashbook & Accounts Ledger
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Opening Balance</span>
                <span className="text-sm font-bold font-mono text-slate-900 block mt-0.5">Rs. {currentReport.cashSummary.openingBalance.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-emerald-600">
                <span className="text-[10px] uppercase font-semibold">Total Receipts</span>
                <span className="text-sm font-bold font-mono block mt-0.5">+ Rs. {currentReport.cashSummary.totalReceipts.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-rose-600">
                <span className="text-[10px] uppercase font-semibold">Total Payments</span>
                <span className="text-sm font-bold font-mono block mt-0.5">- Rs. {currentReport.cashSummary.totalPayments.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Closing Balance</span>
                <span className="text-sm font-bold font-mono text-blue-700 block mt-0.5">Rs. {currentReport.cashSummary.calculatedClosingBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 4. Staff Summary Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
              4. Staff Duty & Workload Allocation
            </h4>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-2">Staff Member</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Assigned Tasks</th>
                  <th className="p-2">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentReport.staffSummary.workloadDistribution?.slice(0, 5).map((s: any, i: number) => (
                  <tr key={i}>
                    <td className="p-2 font-semibold text-slate-900">{s.staffName}</td>
                    <td className="p-2 text-slate-500">{s.role}</td>
                    <td className="p-2 font-bold text-slate-800">{s.assigned}</td>
                    <td className="p-2 font-bold text-emerald-600">{s.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures & Official Approvals Box */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t-2 border-slate-900 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Prepared By (Postal Assistant)
              </span>
              <p className="font-bold text-slate-900">{currentReport.generatedByName}</p>
              <p className="text-[10px] text-slate-400">Timestamp: {new Date(currentReport.generatedAt).toLocaleString()}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Verified & Approved By (Postmaster)
                </span>
                {currentReport.isApproved ? (
                  <div className="flex items-center gap-2 mt-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Signed & Approved by: {currentReport.approvedByName}</span>
                  </div>
                ) : (
                  <p className="text-amber-700 font-semibold mt-1">
                    Official verification and seal pending
                  </p>
                )}
              </div>

              {!currentReport.isApproved && canApprove && (
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow no-print flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{approving ? 'Signing...' : t.reports.approveBtn}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

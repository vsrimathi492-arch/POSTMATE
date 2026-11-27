import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge, CategoryBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { AddMailModal } from '../components/modals/AddMailModal';
import { MailCategory, MailStatus, MailDirection } from '@postmate/shared';
import {
  BookOpen,
  Search,
  Filter,
  Download,
  PlusCircle,
  Eye,
  RefreshCw,
  Printer
} from 'lucide-react';

export const DigitalRegisterPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [mailItems, setMailItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [directionFilter, setDirectionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const pageSize = 20;

  useEffect(() => {
    loadRegister();
  }, [categoryFilter, directionFilter, statusFilter, startDate, endDate, page]);

  useEffect(() => {
    const onRefresh = () => loadRegister();
    window.addEventListener('postmate:refresh', onRefresh);
    return () => window.removeEventListener('postmate:refresh', onRefresh);
  }, []);

  const loadRegister = async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        api.getMailList({
          direction: directionFilter !== 'ALL' ? (directionFilter as MailDirection) : undefined,
          category: categoryFilter !== 'ALL' ? (categoryFilter as MailCategory) : undefined,
          status: statusFilter !== 'ALL' ? (statusFilter as MailStatus) : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: search.trim() || undefined,
          page,
          limit: pageSize
        }),
        api.getMailSummary()
      ]);

      if (listRes.success) {
        setMailItems(listRes.items || []);
        setTotalItems(listRes.total || 0);
      }
      if (summaryRes.success) setSummary(summaryRes.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.nav.digitalRegister}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Single central operational register — automatically maintained without redundant entries
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handlePrint}
            className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <Printer className="w-4 h-4" />
            <span>Print Register</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Registered</span>
            <span className="text-lg font-black text-slate-900 block mt-0.5">{summary.totalCount}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-blue-500">Speed Post</span>
            <span className="text-lg font-black text-blue-700 block mt-0.5">{summary.speedPostCount}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-sky-500">Registered Post</span>
            <span className="text-lg font-black text-sky-700 block mt-0.5">{summary.registeredPostCount}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-amber-500">Parcels</span>
            <span className="text-lg font-black text-amber-700 block mt-0.5">{summary.parcelCount}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-emerald-500">Delivered</span>
            <span className="text-lg font-black text-emerald-700 block mt-0.5">{summary.deliveredCount}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-rose-500">Exceptions</span>
            <span className="text-lg font-black text-rose-700 block mt-0.5">{summary.exceptionCount}</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        <div className="flex-1 min-w-[200px] relative">
          <input
            type="text"
            placeholder="Search tracking #, name, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadRegister()}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="ALL">All Directions</option>
            <option value={MailDirection.INCOMING}>Incoming</option>
            <option value={MailDirection.OUTGOING}>Outgoing</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value={MailCategory.SPEED_POST}>Speed Post</option>
            <option value={MailCategory.REGISTERED_POST}>Registered Post</option>
            <option value={MailCategory.PARCEL}>Parcel</option>
            <option value={MailCategory.MONEY_ORDER}>Money Order</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value={MailStatus.RECEIVED}>Received</option>
            <option value={MailStatus.SCANNED}>Scanned</option>
            <option value={MailStatus.SORTED}>Sorted</option>
            <option value={MailStatus.OUT_FOR_DELIVERY}>Out for Delivery</option>
            <option value={MailStatus.DELIVERED}>Delivered</option>
            <option value={MailStatus.EXCEPTION}>Exception</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
            title="From Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
            title="To Date"
          />
          <button
            type="button"
            onClick={() => { setPage(1); loadRegister(); }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-semibold">
            {t.common.loading}
          </div>
        ) : mailItems.length === 0 ? (
          <EmptyState
            title="Register Empty"
            description="No postal records match current criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Tracking Reference</th>
                  <th className="py-3 px-4">Dir</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Origin & Dest</th>
                  <th className="py-3 px-4">Addressee Details</th>
                  <th className="py-3 px-4">Assigned Agent</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right no-print">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mailItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {item.trackingNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.direction === MailDirection.INCOMING
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}>
                        {item.direction === MailDirection.INCOMING ? 'IN' : 'OUT'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      <span className="text-slate-800 font-medium">{item.originOffice}</span>
                      <span className="text-slate-400 mx-1">→</span>
                      <span className="text-slate-800 font-medium">{item.destinationOffice}</span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900">{item.recipientName}</p>
                      <p className="text-slate-500 text-[11px] truncate">{item.recipientAddress}</p>
                    </td>
                    <td className="py-3 px-4">
                      {item.assignedStaffName || <span className="text-slate-400 italic">None</span>}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.currentStatus} />
                    </td>
                    <td className="py-3 px-4 text-right no-print">
                      <button
                        onClick={() => navigate(`/mail/${item.id}`)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalItems > pageSize && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs no-print">
            <span className="text-slate-500">
              Showing {Math.min((page - 1) * pageSize + 1, totalItems)} - {Math.min(page * pageSize, totalItems)} of {totalItems} records
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-slate-300 bg-white font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page * pageSize >= totalItems}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded-lg border border-slate-300 bg-white font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AddMailModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadRegister}
      />
    </div>
  );
};

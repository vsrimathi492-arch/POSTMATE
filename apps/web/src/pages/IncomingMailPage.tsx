import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge, CategoryBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { AddMailModal } from '../components/modals/AddMailModal';
import { MailDirection, MailCategory, MailStatus } from '@postmate/shared';
import {
  Inbox,
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  Truck,
  Eye,
  RefreshCw
} from 'lucide-react';

export const IncomingMailPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [mailItems, setMailItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    loadIncomingMail();
  }, [categoryFilter, statusFilter]);

  const loadIncomingMail = async () => {
    setLoading(true);
    try {
      const res = await api.getMailList({
        direction: MailDirection.INCOMING,
        category: categoryFilter !== 'ALL' ? (categoryFilter as MailCategory) : undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as MailStatus) : undefined,
        search: search.trim() || undefined
      });
      if (res.success) {
        setMailItems(res.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadIncomingMail();
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.nav.incomingMail}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered mail items received at this office for local beat sorting and delivery
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadIncomingMail}
            className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Incoming Mail</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
          <input
            type="text"
            placeholder={t.mail.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
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
        </div>
      </div>

      {/* Mail Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-semibold">
            {t.common.loading}
          </div>
        ) : mailItems.length === 0 ? (
          <EmptyState
            title="No Incoming Mail Records"
            description="No matching incoming mail items found. Register items or clear search filters."
            actionText="Register New Item"
            onAction={() => setIsAddOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Tracking Reference</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Origin & Date</th>
                  <th className="py-3 px-4">Recipient & Address</th>
                  <th className="py-3 px-4">Assigned Postman</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mailItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {item.trackingNumber}
                    </td>
                    <td className="py-3 px-4">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{item.originOffice}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(item.receivedDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900">{item.recipientName}</p>
                      <p className="text-slate-500 text-[11px] truncate">
                        {item.recipientAddress}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      {item.assignedStaffName ? (
                        <span className="font-medium text-slate-800 flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-blue-600" />
                          <span>{item.assignedStaffName}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.currentStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/mail/${item.id}`)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                        title={t.common.viewDetails}
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
      </div>

      <AddMailModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        initialDirection={MailDirection.INCOMING}
        onSuccess={loadIncomingMail}
      />
    </div>
  );
};

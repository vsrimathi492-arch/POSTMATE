import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, CategoryBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { UpdateStatusModal } from '../components/modals/UpdateStatusModal';
import { MailStatus } from '@postmate/shared';
import {
  PackageCheck,
  CheckCircle2,
  AlertOctagon,
  Phone,
  MapPin,
  RefreshCw,
  Search
} from 'lucide-react';

export const MyDeliveriesPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    loadMyDeliveries();
  }, [user]);

  const loadMyDeliveries = async () => {
    setLoading(true);
    try {
      const res = await api.getMyDeliveries();
      if (res.success) {
        setDeliveries(res.deliveries || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter((d) => {
    if (statusFilter === 'PENDING') {
      return d.status !== MailStatus.DELIVERED;
    }
    if (statusFilter === 'COMPLETED') {
      return d.status === MailStatus.DELIVERED;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.nav.myDeliveries}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Assigned Beat Deliveries for: <strong className="text-slate-800">{user?.name}</strong> ({user?.employeeId})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Tabs */}
          <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'PENDING' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Pending ({deliveries.filter((d) => d.status !== MailStatus.DELIVERED).length})
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'COMPLETED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Delivered ({deliveries.filter((d) => d.status === MailStatus.DELIVERED).length})
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              All ({deliveries.length})
            </button>
          </div>

          <button
            onClick={loadMyDeliveries}
            className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Deliveries Card List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 font-semibold">
          {t.common.loading}
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No Delivery Tasks In This Category"
          description="Your beat deliveries are currently up to date."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDeliveries.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-blue-700">
                      {item.trackingNumber}
                    </span>
                    <CategoryBadge category={item.category} />
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <p className="font-bold text-slate-900 text-sm">{item.recipientName}</p>
                  <p className="text-slate-600 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{item.recipientAddress}</span>
                  </p>
                  {item.recipientPhone && (
                    <p className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.recipientPhone}</span>
                    </p>
                  )}
                </div>

                {item.status === MailStatus.EXCEPTION && (
                  <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <span className="font-bold">Exception: </span>
                    <span>{item.exceptionReason}</span>
                    {item.exceptionNotes && <p className="text-[11px] mt-0.5">{item.exceptionNotes}</p>}
                  </div>
                )}
              </div>

              {item.status !== MailStatus.DELIVERED && (
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Update Delivery / Exception</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <UpdateStatusModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          mailId={selectedItem.mailId}
          trackingNumber={selectedItem.trackingNumber}
          recipientName={selectedItem.recipientName}
          onSuccess={loadMyDeliveries}
        />
      )}
    </div>
  );
};

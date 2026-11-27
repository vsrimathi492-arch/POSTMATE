import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { StatsCard } from '../components/common/StatsCard';
import { StatusBadge, CategoryBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { UpdateStatusModal } from '../components/modals/UpdateStatusModal';
import { MailStatus } from '@postmate/shared';
import {
  Truck,
  CheckCircle2,
  AlertOctagon,
  Clock,
  UserCheck,
  RefreshCw,
  Eye,
  Check
} from 'lucide-react';

export const DeliveryOverviewPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMail, setSelectedMail] = useState<any | null>(null);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const [delRes, sumRes] = await Promise.all([
        api.getDeliveries(),
        api.getDeliverySummary()
      ]);

      if (delRes.success) setDeliveries(delRes.deliveries || []);
      if (sumRes.success) setSummary(sumRes.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.nav.deliveryManagement}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time delivery progress monitoring, staff completion rates, and exception tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDeliveries}
            className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/assign-delivery')}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>Assign Deliveries</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Assigned"
            value={summary.totalAssigned}
            subtitle="Out for local delivery beat"
            icon={Truck}
            color="blue"
          />
          <StatsCard
            title="Delivered Successfully"
            value={summary.delivered}
            subtitle={`${summary.totalAssigned > 0 ? Math.round((summary.delivered / summary.totalAssigned) * 100) : 100}% Success Rate`}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatsCard
            title="Delivery Exceptions"
            value={summary.exceptions}
            subtitle="Premises locked / Intimated"
            icon={AlertOctagon}
            color="rose"
            onClick={() => navigate('/exceptions')}
          />
          <StatsCard
            title="Pending Delivery"
            value={summary.pending}
            subtitle="Currently on delivery beat"
            icon={Clock}
            color="amber"
          />
        </div>
      )}

      {/* Staff Performance & Workload Distribution */}
      {summary?.staffDistribution && summary.staffDistribution.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Delivery Agent Performance & Workload</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.staffDistribution.map((s: any) => (
              <div key={s.staffId} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{s.staffName}</span>
                  <span className="font-mono font-bold text-blue-600">{s.completionRate}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${s.completionRate}%` }}
                    className="h-full bg-emerald-600 rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Assigned: <strong>{s.assignedCount}</strong></span>
                  <span>Delivered: <strong className="text-emerald-600">{s.deliveredCount}</strong></span>
                  <span>Exceptions: <strong className="text-rose-600">{s.exceptionCount}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Delivery Assignments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-semibold">
            {t.common.loading}
          </div>
        ) : deliveries.length === 0 ? (
          <EmptyState
            title="No Active Deliveries"
            description="Assign incoming mail items to postmen to start beat delivery."
            actionText="Assign Deliveries Now"
            onAction={() => navigate('/assign-delivery')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Tracking Reference</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Recipient Name & Address</th>
                  <th className="py-3 px-4">Assigned Agent</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {d.trackingNumber}
                    </td>
                    <td className="py-3 px-4">
                      <CategoryBadge category={d.category} />
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900">{d.recipientName}</p>
                      <p className="text-slate-500 text-[11px] truncate">{d.recipientAddress}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {d.assignedStaffName}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {d.deliveryAttemptCount || 1}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {d.status !== MailStatus.DELIVERED && (
                        <button
                          onClick={() => setSelectedMail(d)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs border border-blue-200 transition"
                        >
                          Update Status
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedMail && (
        <UpdateStatusModal
          isOpen={!!selectedMail}
          onClose={() => setSelectedMail(null)}
          mailId={selectedMail.mailId}
          trackingNumber={selectedMail.trackingNumber}
          recipientName={selectedMail.recipientName}
          onSuccess={loadDeliveries}
        />
      )}
    </div>
  );
};

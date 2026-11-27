import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { CategoryBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { MailStatus, MailDirection } from '@postmate/shared';
import { UserCheck, Truck, CheckCircle2, RefreshCw } from 'lucide-react';

export const AssignDeliveryPage: React.FC = () => {
  const { t } = useLanguage();

  const [unassignedMail, setUnassignedMail] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mailRes, staffRes] = await Promise.all([
        api.getMailList({
          direction: MailDirection.INCOMING,
          limit: 100
        }),
        api.getStaffList()
      ]);

      if (mailRes.success) {
        // Unassigned or sorted items needing postman beat allocation
        const unassigned = (mailRes.items || []).filter(
          (m: any) =>
            m.currentStatus === MailStatus.RECEIVED ||
            m.currentStatus === MailStatus.SCANNED ||
            m.currentStatus === MailStatus.SORTED
        );
        setUnassignedMail(unassigned);
      }
      if (staffRes.success) {
        setStaffList(staffRes.staff || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (mailId: string, staffId: string) => {
    if (!staffId) return;
    setAssigningId(mailId);
    try {
      const res = await api.assignDelivery(mailId, staffId);
      if (res.success) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.nav.assignDelivery}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Assign incoming and sorted mail to beat delivery agents — Single assignment automatically updates delivery, staff workload, and tracking registers
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Staff Capacity Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Available Delivery Staff & Current Workload</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {staffList.map((s) => (
            <div key={s.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">{s.name}</p>
                <p className="text-[10px] text-slate-500">{s.employeeId}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                (s.pendingCount || 0) > 12 ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {s.pendingCount || 0} Pending
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mail items to assign */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Unassigned Mail Items ({unassignedMail.length})
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-semibold">
            {t.common.loading}
          </div>
        ) : unassignedMail.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="All Mail Items Assigned"
            description="All incoming mail items for today have already been assigned to delivery agents."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Tracking Number</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Recipient Name</th>
                  <th className="py-3 px-4">Destination Address</th>
                  <th className="py-3 px-4">Area / Beat</th>
                  <th className="py-3 px-4">Assign To Postman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unassignedMail.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {item.trackingNumber}
                    </td>
                    <td className="py-3 px-4">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.recipientName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {item.recipientAddress}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {item.sortingArea || 'Beat 1'}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        disabled={assigningId === item.id}
                        defaultValue=""
                        onChange={(e) => handleAssign(item.id, e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" disabled>Select Staff to Assign...</option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.pendingCount || 0} tasks)
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@postmate/shared';
import {
  Users,
  CheckCircle2,
  RefreshCw,
  Scale,
  ArrowRightLeft
} from 'lucide-react';

export const StaffManagementPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const canManage = user?.role === UserRole.ADMIN || user?.role === UserRole.POSTMASTER;

  const [staffList, setStaffList] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [reassigning, setReassigning] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    loadStaff();
  }, [user]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const staffRes = await api.getStaffList();
      if (staffRes.success) setStaffList(staffRes.staff || []);

      if (canManage) {
        const suggRes = await api.getWorkloadSuggestions();
        if (suggRes.success) setSuggestions(suggRes);
      } else {
        setSuggestions(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    if (!canManage) return;
    try {
      await api.toggleStaffAvailability(id, !current);
      loadStaff();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveReassign = async (fromStaffId: string, toStaffId: string) => {
    setReassigning(true);
    setActionMsg(null);
    try {
      const res = await api.reassignStaffTasks(fromStaffId, toStaffId, 2);
      if (res.success) {
        setActionMsg(res.message);
        loadStaff();
      } else {
        setActionMsg(res.message || 'Reassignment failed.');
      }
    } catch (e: any) {
      setActionMsg(e.message || 'Reassignment error.');
    } finally {
      setReassigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.nav.staffManagement}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor postal staff duty allocations, live pending tasks, and review intelligent workload balancing suggestions
          </p>
        </div>

        <button
          onClick={loadStaff}
          className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Balancing Suggestions Alert */}
      {suggestions?.balancingSuggestions && suggestions.balancingSuggestions.length > 0 && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs">
          <div className="flex items-center gap-2 mb-2 text-blue-900 font-bold">
            <Scale className="w-4 h-4 text-blue-600" />
            <span>Smart Workload Balancing Recommendations</span>
          </div>
          <p className="text-slate-600 mb-3">
            POSTMATE detected high task concentration on specific beats. Authorized Postmaster approval is required before reassigning tasks:
          </p>
          <div className="space-y-2">
            {suggestions.balancingSuggestions.map((item: any, i: number) => (
              <div key={i} className="p-3 bg-white rounded-xl border border-blue-100 space-y-2">
                <p className="font-semibold text-slate-900">
                  Staff <strong>{item.overloadedStaff}</strong> currently holds <strong>{item.overloadCount} pending tasks</strong>.
                </p>
                {item.recommendedReassignees?.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {item.recommendedReassignees.map((r: any) => (
                      <button
                        key={r.id}
                        type="button"
                        disabled={reassigning}
                        onClick={() => handleApproveReassign(item.overloadedStaffId, r.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Approve & Transfer 2 Tasks to {r.name} ({r.currentPending} pending)</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px]">No underloaded staff currently available for redistribution.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staffList.map((staff) => (
          <div
            key={staff.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{staff.name}</h4>
                <p className="text-slate-500 text-[11px]">Emp ID: {staff.employeeId}</p>
                <span className="inline-block px-2 py-0.5 mt-1 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                  {staff.role?.replace(/_/g, ' ')}
                </span>
              </div>

              <button
                type="button"
                disabled={!canManage}
                onClick={() => handleToggle(staff.id, staff.isActive)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  staff.isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                } ${!canManage ? 'cursor-default opacity-80' : 'hover:opacity-90'}`}
                title={canManage ? 'Toggle On-Duty Availability' : 'Duty Status (Postmaster Managed)'}
              >
                <span>{staff.isActive ? 'Active Duty' : 'On Leave'}</span>
              </button>
            </div>

            {/* Task Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
              <div className="p-2 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Assigned</span>
                <span className="text-base font-extrabold text-slate-900">{staff.assignedCount || 0}</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50">
                <span className="text-[10px] text-emerald-600 block font-semibold uppercase">Delivered</span>
                <span className="text-base font-extrabold text-emerald-700">{staff.completedCount || 0}</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50">
                <span className="text-[10px] text-amber-600 block font-semibold uppercase">Pending</span>
                <span className="text-base font-extrabold text-amber-700">{staff.pendingCount || 0}</span>
              </div>
            </div>

            {/* Progress Completion Rate */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-semibold">
                <span className="text-slate-500">Beat Delivery Rate</span>
                <span className="text-blue-600">{staff.completionRate || 0}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${staff.completionRate || 0}%` }}
                  className="h-full bg-blue-600 rounded-full transition-all"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Workload Level:</span>
              <span className={`font-bold ${
                staff.workloadStatus === 'HIGH' ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {staff.workloadStatus || 'BALANCED'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

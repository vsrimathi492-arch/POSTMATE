import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { t } = useLanguage();

  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardMetrics();
      if (res.success) {
        setMetrics(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const trends = metrics?.trends || [];
  const counts = metrics?.counts || {};
  const delivery = metrics?.delivery || {};
  const bottlenecks = metrics?.bottlenecks || [];
  const staffWorkload = metrics?.staffWorkload || [];
  const hasTrendData = metrics?.hasTrendData;

  useEffect(() => {
    const onRefresh = () => loadAnalytics();
    window.addEventListener('postmate:refresh', onRefresh);
    return () => window.removeEventListener('postmate:refresh', onRefresh);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.nav.analytics}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational bottlenecks, throughput ratios, and volume distribution derived from verified records
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Operational Bottlenecks Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Operational Bottlenecks & Workflow Diagnosis</span>
        </h3>
        {bottlenecks.length === 0 ? (
          <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Zero operational bottlenecks identified. All scanned mail items have been sorted or assigned.</span>
          </p>
        ) : (
          <div className="space-y-2 text-xs">
            {bottlenecks.map((b: string, i: number) => (
              <div key={i} className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-medium">
                • {b}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ratios & Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Throughput Ratio</h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Incoming Ratio</span>
                <span className="text-blue-600">
                  {counts.totalCount > 0 ? Math.round((counts.incomingCount / counts.totalCount) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${counts.totalCount > 0 ? (counts.incomingCount / counts.totalCount) * 100 : 0}%` }}
                  className="h-full bg-blue-600 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Delivery Completion Rate</span>
                <span className="text-emerald-600">
                  {delivery.totalAssigned > 0 ? Math.round((delivery.delivered / delivery.totalAssigned) * 100) : 100}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${delivery.totalAssigned > 0 ? (delivery.delivered / delivery.totalAssigned) * 100 : 100}%` }}
                  className="h-full bg-emerald-600 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">7-Day Mail Traffic (Verified DB Records)</h3>
          {!hasTrendData ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No mail traffic recorded over the last 7 days.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {trends.map((tItem: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">{tItem.day} ({tItem.date})</span>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-600 font-semibold">{tItem.incoming} In</span>
                    <span className="text-purple-600 font-semibold">{tItem.outgoing} Out</span>
                    <span className="text-emerald-600 font-semibold">{tItem.delivered} Del</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff Workload Distribution */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>Staff Workload Distribution</span>
        </h3>
        {staffWorkload.length === 0 ? (
          <p className="text-xs text-slate-400">No staff workload records available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {staffWorkload.map((s: any) => {
              const rate = s.assigned > 0 ? Math.round((s.completed / s.assigned) * 100) : 0;
              return (
                <div key={s.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{s.name}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{s.role.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Assigned: <strong>{s.assigned}</strong></span>
                    <span className="text-emerald-700">Completed: <strong>{s.completed}</strong></span>
                    <span className="text-amber-700">Pending: <strong>{s.pending}</strong></span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div style={{ width: `${rate}%` }} className="h-full bg-blue-600 rounded-full" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

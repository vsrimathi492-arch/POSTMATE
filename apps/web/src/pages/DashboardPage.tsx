import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { StatsCard } from '../components/common/StatsCard';
import { StatusBadge, CategoryBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import {
  Inbox,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Users,
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
  Boxes,
  Truck,
  Building2,
  Calendar
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, office } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<any | null>(null);
  const [recentMail, setRecentMail] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const onRefresh = () => loadDashboardData();
    window.addEventListener('postmate:refresh', onRefresh);
    return () => window.removeEventListener('postmate:refresh', onRefresh);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, mailRes] = await Promise.all([
        api.getDashboardMetrics(),
        api.getMailList({ limit: 5 })
      ]);

      if (dashRes.success) {
        setMetrics(dashRes);
      }
      if (mailRes.success) {
        setRecentMail(mailRes.items || []);
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  const counts = metrics?.counts || {
    incomingCount: 0,
    outgoingCount: 0,
    pendingCount: 0,
    deliveredCount: 0,
    totalCount: 0
  };
  const delivery = metrics?.delivery || {
    totalAssigned: 0,
    delivered: 0,
    exceptions: 0,
    pending: 0
  };
  const cash = metrics?.cash || {
    openingBalance: 12500,
    totalReceipts: 0,
    totalPayments: 0,
    calculatedClosingBalance: 12500,
    reconciliationStatus: 'PENDING'
  };
  const bottlenecks = metrics?.bottlenecks || [];
  const trends = metrics?.trends || [];
  const categoryVolume = metrics?.categoryVolume || {};

  const todayStr = new Date().toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Welcome & Office Information Header */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              OPERATIONAL HUB
            </span>
            <span className="text-slate-400 text-xs flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {todayStr}
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {t.dashboard.welcome}, {user?.name || 'Postmaster'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{office?.name || 'Anna Nagar Sub Post Office'}</span>
            <span className="text-slate-500">|</span>
            <span>Pin: {office?.pincode || '600040'}</span>
            <span className="text-slate-500">|</span>
            <span>Type: {office?.type || 'Town'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              {t.cashbook.closingBalance}
            </span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              Rs. {cash.calculatedClosingBalance?.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => navigate('/reports')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t.quickActions.generateReport}</span>
          </button>
        </div>
      </div>

      {/* Live Operational Counters (Live Database Records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t.dashboard.incomingMail}
          value={counts.incomingCount}
          subtitle="Received for this office"
          icon={Inbox}
          color="blue"
          onClick={() => navigate('/incoming')}
        />
        <StatsCard
          title={t.dashboard.outgoingMail}
          value={counts.outgoingCount}
          subtitle="Booked & outward dispatch"
          icon={Send}
          color="purple"
          onClick={() => navigate('/outgoing')}
        />
        <StatsCard
          title={t.dashboard.pendingProcessing}
          value={counts.pendingCount}
          subtitle="Sorting or delivery pending"
          icon={Clock}
          color="amber"
          onClick={() => navigate('/register')}
        />
        <StatsCard
          title={t.dashboard.deliveredToday}
          value={counts.deliveredCount}
          subtitle={`${delivery.totalAssigned > 0 ? Math.round((counts.deliveredCount / delivery.totalAssigned) * 100) : 100}% Delivery Success`}
          icon={CheckCircle2}
          color="emerald"
          onClick={() => navigate('/delivery')}
        />
      </div>

      {/* Operational Alerts & Bottlenecks */}
      {bottlenecks.length > 0 ? (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <h4 className="font-bold text-amber-900 uppercase tracking-wider text-[11px]">
              {t.dashboard.activeAlerts} ({bottlenecks.length})
            </h4>
          </div>
          <div className="space-y-1.5 pl-6">
            {bottlenecks.map((item: string, i: number) => (
              <li key={i} className="text-amber-800 list-disc font-medium">
                {item}
              </li>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 text-xs flex items-center gap-2 text-emerald-800 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{t.dashboard.noAlerts}</span>
        </div>
      )}

      {/* Two Column Grid: Weekly Trends & Recent Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Mail Flow Analytics & Category Volume */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Trend Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {t.dashboard.weeklyTrend}
                </h3>
                <p className="text-xs text-slate-500">Live operational mail traffic over last 7 days</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                DAILY VOLUME
              </span>
            </div>

            {/* Visual Bar Chart */}
            {!metrics?.hasTrendData ? (
              <div className="py-10 text-center text-xs text-slate-400 border-b border-slate-100">
                No verified mail records in the past 7 days to chart yet. Register or scan mail to populate live trends.
              </div>
            ) : (
              <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
                {trends.map((tItem: any, idx: number) => {
                  const maxVal = Math.max(...trends.map((tr: any) => Math.max(tr.incoming, tr.outgoing)), 1);
                  const incHeight = tItem.incoming > 0 ? Math.max(12, Math.round((tItem.incoming / maxVal) * 120)) : 2;
                  const outHeight = tItem.outgoing > 0 ? Math.max(12, Math.round((tItem.outgoing / maxVal) * 120)) : 2;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1">
                        <div
                          style={{ height: `${incHeight}px` }}
                          className={`w-3 sm:w-4 rounded-t-sm transition-all ${tItem.incoming > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-200'}`}
                          title={`Incoming: ${tItem.incoming}`}
                        />
                        <div
                          style={{ height: `${outHeight}px` }}
                          className={`w-3 sm:w-4 rounded-t-sm transition-all ${tItem.outgoing > 0 ? 'bg-purple-500 hover:bg-purple-600' : 'bg-slate-200'}`}
                          title={`Outgoing: ${tItem.outgoing}`}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 mt-1">
                        {tItem.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-600" />
                <span>{t.dashboard.incomingMail}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-purple-500" />
                <span>{t.dashboard.outgoingMail}</span>
              </div>
            </div>
          </div>

          {/* Volume by Category Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-3">
              {t.dashboard.categoryDistribution}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {Object.entries(categoryVolume).map(([cat, count]: [string, any]) => (
                <div key={cat} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider truncate">
                    {cat.replace(/_/g, ' ')}
                  </span>
                  <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Recent Operations & Pending Tasks */}
        <div className="space-y-6">
          {/* Quick Cash Summary Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>{t.nav.cashbook}</span>
              </h3>
              <button
                onClick={() => navigate('/cashbook')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                View Ledger
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{t.cashbook.openingBalance}</span>
                <span className="font-mono font-semibold">Rs. {cash.openingBalance?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-600 font-semibold">
                <span>{t.cashbook.totalReceipts}</span>
                <span className="font-mono">+ Rs. {cash.totalReceipts?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600 font-semibold">
                <span>{t.cashbook.totalPayments}</span>
                <span className="font-mono">- Rs. {cash.totalPayments?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-slate-900 text-sm">
                <span>{t.cashbook.closingBalance}</span>
                <span className="font-mono text-blue-700">Rs. {cash.calculatedClosingBalance?.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Reconciliation:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                cash.reconciliationStatus === 'RECONCILED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {cash.reconciliationStatus}
              </span>
            </div>
          </div>

          {/* Recent Operations Activity List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {t.dashboard.recentActivities}
              </h3>
              <button
                onClick={() => navigate('/register')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Full Register →
              </button>
            </div>

            {recentMail.length === 0 ? (
              <EmptyState
                title="No Mail Items"
                description="Use Quick Actions to register or scan incoming mail."
              />
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {recentMail.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/mail/${item.id}`)}
                    className="py-2.5 hover:bg-slate-50 px-1 rounded-lg cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono font-bold text-blue-700">
                          {item.trackingNumber}
                        </span>
                        <CategoryBadge category={item.category} />
                      </div>
                      <p className="text-slate-600 text-[11px] truncate max-w-[180px]">
                        To: {item.recipientName}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={item.currentStatus} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

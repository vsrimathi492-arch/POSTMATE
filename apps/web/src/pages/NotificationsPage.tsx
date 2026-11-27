import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { EmptyState } from '../components/common/EmptyState';
import { Bell, CheckCircle2, AlertTriangle, RefreshCw, Check } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { t, language } = useLanguage();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.nav.notifications}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational alerts, priority consignment notices, cashbook reconciliation reminders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadNotifications}
            className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
          >
            Mark All Read
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 text-xs">
        {loading ? (
          <div className="py-12 text-center font-semibold text-slate-500">
            {t.common.loading}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No Notifications"
            description="You are completely caught up. No pending operational alerts."
          />
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition ${
                !n.isRead ? 'bg-blue-50/50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl mt-0.5 ${
                  n.type === 'ALERT' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">
                    {language === 'ta' && n.titleTa ? n.titleTa : n.title}
                  </h4>
                  <p className="text-slate-600 mt-0.5">
                    {language === 'ta' && n.messageTa ? n.messageTa : n.message}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Category: {n.category} • {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700 flex items-center gap-1 flex-shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Read</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

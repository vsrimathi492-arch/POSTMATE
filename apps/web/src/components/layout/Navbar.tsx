import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import {
  Bell,
  Globe,
  Building2,
  User,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Menu,
  ChevronDown
} from 'lucide-react';

export const Navbar: React.FC<{ onToggleSidebar: () => void }> = ({ onToggleSidebar }) => {
  const { user, office, quickLogin, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    loadNotifications();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left: Brand Identity & Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-lg text-white shadow-inner">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">POSTMATE</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  SMART OPS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-tight hidden sm:block">
                {t.app.tagline}
              </p>
            </div>
          </div>

          {/* Active Post Office Pill */}
          <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-slate-700">
            <Building2 className="w-4 h-4 text-blue-400" />
            <div className="text-xs">
              <span className="font-medium text-slate-200">{office?.name || 'Anna Nagar Sub Post Office'}</span>
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-slate-800 text-slate-300 rounded border border-slate-700">
                {office?.code || 'PO-600040'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions, Language Switcher, Notifications, Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Tamil / English Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
            title="Switch Language / மொழியை மாற்றவும்"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* Quick Role Switcher (Demonstration Helper) */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Role: <strong className="text-white">{user?.role?.replace('_', ' ')}</strong></span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs">
                <p className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Switch Role</p>
                <button
                  onClick={() => { quickLogin('POSTMASTER'); setShowRoleMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between"
                >
                  <span className="font-semibold text-slate-900">Postmaster (Full Ops)</span>
                  {user?.role === 'POSTMASTER' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => { quickLogin('POSTAL_STAFF'); setShowRoleMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between"
                >
                  <span className="font-semibold text-slate-900">Postal Assistant (Counter)</span>
                  {user?.employeeId === 'PA600041' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => { quickLogin('DELIVERY'); setShowRoleMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between"
                >
                  <span className="font-semibold text-slate-900">Beat Postman (Delivery)</span>
                  {user?.employeeId === 'PMTS600042' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => { quickLogin('ADMIN'); setShowRoleMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between border-t border-slate-100 mt-1 pt-1"
                >
                  <span className="font-semibold text-slate-900">Administrator</span>
                  {user?.role === 'ADMIN' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Alerts & Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-blue-300 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">No recent notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-3 hover:bg-slate-50 transition ${!n.isRead ? 'bg-blue-50/60' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${n.type === 'ALERT' ? 'text-rose-500' : 'text-blue-500'}`} />
                          <div>
                            <p className="font-semibold text-slate-900">
                              {language === 'ta' && n.titleTa ? n.titleTa : n.title}
                            </p>
                            <p className="text-slate-600 text-[11px] mt-0.5">
                              {language === 'ta' && n.messageTa ? n.messageTa : n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold text-xs">
              {user?.name?.slice(0, 2).toUpperCase() || 'PM'}
            </div>
            <div className="hidden xl:block text-left text-xs">
              <p className="font-semibold text-slate-100 leading-tight">{user?.name || 'Staff'}</p>
              <p className="text-[10px] text-slate-400">{user?.employeeId || 'PM600040'}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
              title={t.nav.logout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

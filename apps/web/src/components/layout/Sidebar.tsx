import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Inbox,
  Send,
  BookOpen,
  ScanLine,
  Boxes,
  Truck,
  UserCheck,
  PackageCheck,
  AlertOctagon,
  Users,
  Wallet,
  Scale,
  Search,
  FileSpreadsheet,
  BarChart3,
  Bell,
  Settings
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const navGroups = [
    {
      label: 'Operations & Registry',
      items: [
        { to: '/', label: t.nav.dashboard, icon: LayoutDashboard },
        { to: '/incoming', label: t.nav.incomingMail, icon: Inbox },
        { to: '/outgoing', label: t.nav.outgoingMail, icon: Send },
        { to: '/register', label: t.nav.digitalRegister, icon: BookOpen },
        { to: '/scan', label: t.nav.smartScanning, icon: ScanLine },
        { to: '/sorting', label: t.nav.smartSorting, icon: Boxes }
      ]
    },
    {
      label: 'Delivery Management',
      items: [
        { to: '/delivery', label: t.nav.deliveryManagement, icon: Truck },
        { to: '/assign-delivery', label: t.nav.assignDelivery, icon: UserCheck },
        { to: '/my-deliveries', label: t.nav.myDeliveries, icon: PackageCheck },
        { to: '/exceptions', label: t.nav.deliveryExceptions, icon: AlertOctagon }
      ]
    },
    {
      label: 'Accounts & Staff',
      items: [
        { to: '/cashbook', label: t.nav.cashbook, icon: Wallet },
        { to: '/reconciliation', label: t.nav.cashReconciliation, icon: Scale },
        { to: '/staff', label: t.nav.staffManagement, icon: Users },
        { to: '/enquiry', label: t.nav.customerEnquiry, icon: Search }
      ]
    },
    {
      label: 'Reports & Admin',
      items: [
        { to: '/reports', label: t.nav.reports, icon: FileSpreadsheet },
        { to: '/analytics', label: t.nav.analytics, icon: BarChart3 },
        { to: '/notifications', label: t.nav.notifications, icon: Bell },
        { to: '/settings', label: t.nav.settings, icon: Settings }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-[53px] bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between overflow-y-auto`}
      >
        <div className="py-4 px-3 space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {group.label}
              </p>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Operational Status Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-300 font-medium">Single-Source Core</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              SYNCED
            </span>
          </div>
          <p className="text-[10px] text-slate-500">Auto-Register Updates Active</p>
        </div>
      </aside>
    </>
  );
};

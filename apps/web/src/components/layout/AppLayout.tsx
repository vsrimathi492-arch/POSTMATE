import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useLanguage } from '../../context/LanguageContext';
import { AddMailModal } from '../modals/AddMailModal';
import { ScanMailModal } from '../modals/ScanMailModal';
import { AddTransactionModal } from '../modals/AddTransactionModal';
import {
  ScanLine,
  PlusCircle,
  Boxes,
  Truck,
  Wallet,
  FileSpreadsheet
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddMailOpen, setIsAddMailOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isCashOpen, setIsCashOpen] = useState(false);

  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Quick Action Floating / Header Toolbar */}
          <div className="mb-6 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pl-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              {t.quickActions.title}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsScanOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>1. {t.quickActions.scanMail}</span>
              </button>

              <button
                onClick={() => setIsAddMailOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>2. {t.quickActions.addMail}</span>
              </button>

              <button
                onClick={() => navigate('/sorting')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>3. {t.quickActions.smartSorting}</span>
              </button>

              <button
                onClick={() => navigate('/assign-delivery')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>4. {t.quickActions.assignDelivery}</span>
              </button>

              <button
                onClick={() => setIsCashOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>5. {t.quickActions.cashbook}</span>
              </button>

              <button
                onClick={() => navigate('/reports')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-100 hover:bg-slate-900 shadow-sm transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>6. {t.quickActions.generateReport}</span>
              </button>
            </div>
          </div>

          {/* Child Pages */}
          <Outlet />
        </main>
      </div>

      {/* Global Modals Triggerable From Quick Actions */}
      <AddMailModal
        isOpen={isAddMailOpen}
        onClose={() => setIsAddMailOpen(false)}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent('postmate:refresh'));
        }}
      />

      <ScanMailModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent('postmate:refresh'));
        }}
      />

      <AddTransactionModal
        isOpen={isCashOpen}
        onClose={() => setIsCashOpen(false)}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent('postmate:refresh'));
        }}
      />
    </div>
  );
};

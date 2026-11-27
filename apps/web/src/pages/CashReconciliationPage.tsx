import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Scale, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export const CashReconciliationPage: React.FC = () => {
  const { t } = useLanguage();

  const [balance, setBalance] = useState<any | null>(null);
  const [physicalCash, setPhysicalCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    setLoading(true);
    try {
      const res = await api.getCashBalance();
      if (res.success) {
        setBalance(res.balance);
        setPhysicalCash(res.balance.calculatedClosingBalance?.toString() || '0');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calculatedBalance = balance?.calculatedClosingBalance || 0;
  const numPhysical = Number(physicalCash);
  const discrepancy = isNaN(numPhysical) ? 0 : numPhysical - calculatedBalance;

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.reconcileCash({
        date: new Date().toISOString(),
        verifiedPhysicalBalance: numPhysical,
        notes: notes || undefined
      });

      if (res.success) {
        setMessage(res.message);
        loadBalance();
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.nav.cashReconciliation}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical Cash Chest Verification & Daily Safe Reconciliation
          </p>
        </div>

        <button
          onClick={loadBalance}
          className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {balance && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Calculated Ledger Balance
              </span>
              <span className="text-2xl font-black font-mono text-slate-900">
                Rs. {calculatedBalance.toFixed(2)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Receipts / Payments Flow
              </span>
              <span className="text-sm font-semibold text-slate-800">
                +{balance.totalReceipts?.toFixed(2)} / -{balance.totalPayments?.toFixed(2)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Current Status
              </span>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                balance.reconciliationStatus === 'RECONCILED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {balance.reconciliationStatus}
              </span>
            </div>
          </div>

          {message && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleReconcile} className="space-y-4 text-xs pt-4 border-t border-slate-100">
            <div>
              <label className="font-semibold text-slate-800 block mb-1 text-sm">
                Physical Cash Chest Verification Count (Rs.) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={physicalCash}
                onChange={(e) => setPhysicalCash(e.target.value)}
                className="w-full max-w-md px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Live Calculation */}
            <div className={`p-4 rounded-xl border flex items-center justify-between max-w-md ${
              discrepancy === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                {discrepancy === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                )}
                <span className="font-bold">
                  {discrepancy === 0 ? 'Verified Zero Discrepancy' : 'Variance / Discrepancy:'}
                </span>
              </div>
              <span className="font-mono font-black text-base">
                Rs. {discrepancy.toFixed(2)}
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Reconciliation Remarks & Postmaster Signature Notes
              </label>
              <textarea
                rows={3}
                placeholder="Notes on physical cash check..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full max-w-md px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? 'Reconciling...' : 'Confirm Postmaster Physical Sign-off'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

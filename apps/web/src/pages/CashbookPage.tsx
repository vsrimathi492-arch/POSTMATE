import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/common/EmptyState';
import { AddTransactionModal } from '../components/modals/AddTransactionModal';
import { ReconcileCashModal } from '../components/modals/ReconcileCashModal';
import { TransactionType } from '@postmate/shared';
import {
  Wallet,
  PlusCircle,
  Scale,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

export const CashbookPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);

  useEffect(() => {
    loadCashData();
  }, []);

  const loadCashData = async () => {
    setLoading(true);
    try {
      const [txRes, balRes] = await Promise.all([
        api.getCashTransactions(),
        api.getCashBalance()
      ]);

      if (txRes.success) setTransactions(txRes.transactions || []);
      if (balRes.success) setBalance(balRes.balance);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTransaction = async (id: string) => {
    try {
      const res = await api.verifyTransaction(id);
      if (res.success) {
        loadCashData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.nav.cashbook}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Single-source cash ledger — Automatically tracks counter bookings, money orders, savings deposits & expenses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCashData}
            className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsReconcileOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <Scale className="w-4 h-4" />
            <span>{t.cashbook.reconcileNow}</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Cash Entry</span>
          </button>
        </div>
      </div>

      {/* Cash Balance Metric Ribbon */}
      {balance && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.cashbook.openingBalance}
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
              Rs. {balance.openingBalance?.toFixed(2)}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Brought forward from previous day</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              {t.cashbook.totalReceipts}
            </span>
            <span className="text-xl font-bold font-mono text-emerald-600 mt-1 block">
              + Rs. {balance.totalReceipts?.toFixed(2)}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Bookings, POSB & collections</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
              {t.cashbook.totalPayments}
            </span>
            <span className="text-xl font-bold font-mono text-rose-600 mt-1 block">
              - Rs. {balance.totalPayments?.toFixed(2)}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Money orders paid & expenses</p>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 shadow-sm">
            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
              {t.cashbook.closingBalance}
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
              Rs. {balance.calculatedClosingBalance?.toFixed(2)}
            </span>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Reconciliation:</span>
              <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                balance.reconciliationStatus === 'RECONCILED'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {balance.reconciliationStatus}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Daily Operational Transactions ({transactions.length})
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-semibold">
            {t.common.loading}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No Transactions Recorded Today"
            description="Use Record Cash Entry to log counter receipt or expense."
            actionText="Record First Transaction"
            onAction={() => setIsAddOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Txn Number</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Narration / Tracking #</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Entered By</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {tx.transactionNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      {tx.type === TransactionType.RECEIPT ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                          <ArrowDownLeft className="w-3 h-3" />
                          <span>RECEIPT</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] border border-rose-200">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>PAYMENT</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {tx.category.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-600 truncate">
                      {tx.description}
                      {tx.relatedTrackingNumber && (
                        <span className="ml-1.5 font-mono text-[11px] font-bold text-blue-600">
                          [{tx.relatedTrackingNumber}]
                        </span>
                      )}
                    </td>
                    <td className={`py-3 px-4 font-mono font-bold ${
                      tx.type === TransactionType.RECEIPT ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {tx.type === TransactionType.RECEIPT ? '+' : '-'} Rs. {tx.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {tx.enteredByName}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {tx.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified ({tx.verifiedByName})</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleVerifyTransaction(tx.id)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition"
                        >
                          Verify (Postmaster)
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

      <AddTransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadCashData}
      />

      {balance && (
        <ReconcileCashModal
          isOpen={isReconcileOpen}
          onClose={() => setIsReconcileOpen(false)}
          calculatedBalance={balance.calculatedClosingBalance}
          onSuccess={loadCashData}
        />
      )}
    </div>
  );
};

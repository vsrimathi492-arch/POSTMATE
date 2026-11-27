import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { Scale, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ReconcileCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculatedBalance: number;
  onSuccess: () => void;
}

export const ReconcileCashModal: React.FC<ReconcileCashModalProps> = ({
  isOpen,
  onClose,
  calculatedBalance,
  onSuccess
}) => {
  const [physicalCash, setPhysicalCash] = useState(calculatedBalance.toString());
  const [notes, setNotes] = useState('Physically verified against cash chest contents.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numPhysical = Number(physicalCash);
  const discrepancy = isNaN(numPhysical) ? 0 : numPhysical - calculatedBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(numPhysical)) {
      setError('Please enter a valid physical cash amount.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.reconcileCash({
        date: new Date().toISOString(),
        verifiedPhysicalBalance: numPhysical,
        notes
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Cashbook Reconciliation"
      subtitle="Verify Physical Safe Cash Against Digital Ledger Balance"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-slate-100 rounded-xl">
          <div className="flex items-center justify-between text-slate-600">
            <span>System Calculated Balance:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              Rs. {calculatedBalance.toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            Physical Cash Count in Office Chest (Rs.) *
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={physicalCash}
            onChange={(e) => setPhysicalCash(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Live Discrepancy Display */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          discrepancy === 0
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {discrepancy === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span className="font-semibold">
              {discrepancy === 0 ? 'Zero Discrepancy (Exact Match)' : 'Discrepancy Noted:'}
            </span>
          </div>
          <span className="font-mono font-bold text-sm">
            Rs. {discrepancy.toFixed(2)}
          </span>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Verification Remarks / Audit Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300"
          />
        </div>

        {error && <p className="text-rose-600 font-semibold">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Scale className="w-4 h-4" />
            <span>{loading ? 'Reconciling...' : 'Approve & Reconcile'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

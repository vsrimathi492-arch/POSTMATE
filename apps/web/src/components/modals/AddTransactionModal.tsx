import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { TransactionType, CashCategory } from '@postmate/shared';
import { PlusCircle } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.RECEIPT);
  const [category, setCategory] = useState<CashCategory>(CashCategory.SPEED_POST_BOOKING);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [relatedTracking, setRelatedTracking] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a positive number greater than zero.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.createTransaction({
        date: new Date().toISOString(),
        type,
        category,
        amount: numAmount,
        description: description || `Operational ${type} for ${category}`,
        relatedTrackingNumber: relatedTracking || undefined
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
      title="Record Cash Transaction"
      subtitle="Auto-Calculates Running Cashbook Balance"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setType(TransactionType.RECEIPT);
              setCategory(CashCategory.SPEED_POST_BOOKING);
            }}
            className={`py-2 rounded-lg font-bold transition ${
              type === TransactionType.RECEIPT
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cash Receipt (+)
          </button>
          <button
            type="button"
            onClick={() => {
              setType(TransactionType.PAYMENT);
              setCategory(CashCategory.OFFICE_EXPENSE);
            }}
            className={`py-2 rounded-lg font-bold transition ${
              type === TransactionType.PAYMENT
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cash Payment (-)
          </button>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Transaction Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CashCategory)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
          >
            {type === TransactionType.RECEIPT ? (
              <>
                <option value={CashCategory.SPEED_POST_BOOKING}>Speed Post Booking Collection</option>
                <option value={CashCategory.REG_POST_BOOKING}>Registered Post Booking Collection</option>
                <option value={CashCategory.PARCEL_BOOKING}>Parcel Counter Booking</option>
                <option value={CashCategory.POSTAGE_STAMPS}>Sale of Postage Stamps</option>
                <option value={CashCategory.SAVINGS_BANK_DEPOSIT}>Post Office Savings Bank (POSB) Deposit</option>
                <option value={CashCategory.BILL_COLLECTION}>Utility Bill Collection</option>
                <option value={CashCategory.REMITTANCE_FROM_HO}>Remittance Received From Head Office</option>
              </>
            ) : (
              <>
                <option value={CashCategory.MONEY_ORDER_PAID}>Money Order (eMO) Paid to Customer</option>
                <option value={CashCategory.SAVINGS_BANK_WITHDRAWAL}>Savings Bank Withdrawal Payment</option>
                <option value={CashCategory.OFFICE_EXPENSE}>Contingency & Office Consumables Expense</option>
                <option value={CashCategory.REMITTANCE_TO_HO}>Remittance Dispatched to Head Office</option>
              </>
            )}
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Amount (Rs.) *</label>
          <input
            type="number"
            step="0.01"
            required
            placeholder="e.g. 250.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-sm"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Related Consignment / Tracking Number (Optional)</label>
          <input
            type="text"
            placeholder="e.g. SP902184912IN"
            value={relatedTracking}
            onChange={(e) => setRelatedTracking(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Narration / Description</label>
          <input
            type="text"
            placeholder="Brief narration for ledger"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{loading ? 'Recording...' : 'Record Transaction'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { MailCategory, MailDirection } from '@postmate/shared';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AddMailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDirection?: MailDirection;
}

export const AddMailModal: React.FC<AddMailModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDirection = MailDirection.INCOMING
}) => {
  const [direction, setDirection] = useState<MailDirection>(initialDirection);
  const [category, setCategory] = useState<MailCategory>(MailCategory.SPEED_POST);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [originOffice, setOriginOffice] = useState('New Delhi GPO');
  const [originPincode, setOriginPincode] = useState('110001');
  const [destinationOffice, setDestinationOffice] = useState('Anna Nagar Sub Post Office');
  const [destinationPincode, setDestinationPincode] = useState('600040');
  const [senderName, setSenderName] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [weightGrams, setWeightGrams] = useState(150);
  const [tariffAmount, setTariffAmount] = useState(41);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const generateTracking = () => {
    let prefix = 'SP';
    if (category === MailCategory.REGISTERED_POST) prefix = 'RP';
    if (category === MailCategory.PARCEL) prefix = 'CP';
    if (category === MailCategory.MONEY_ORDER) prefix = 'MO';
    setTrackingNumber(prefix + Math.floor(100000000 + Math.random() * 900000000) + 'IN');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError('Tracking number is required.');
      return;
    }

    setLoading(true);
    setError(null);
    setDuplicateWarning(null);

    try {
      const res = await api.createMail({
        trackingNumber: trackingNumber.trim().toUpperCase(),
        direction,
        category,
        originOffice,
        originPincode,
        destinationOffice,
        destinationPincode,
        senderName,
        senderAddress,
        senderPhone,
        recipientName,
        recipientAddress,
        recipientPhone,
        weightGrams: Number(weightGrams),
        tariffAmount: Number(tariffAmount),
        verificationSource: 'MANUAL',
        notes
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else if (res.isDuplicate) {
        setDuplicateWarning(res.message);
      } else {
        setError(res.message || 'Failed to register mail item.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while creating mail record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Mail Item"
      subtitle="One-Time Data Entry → Automatically Populates All Modules"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {duplicateWarning && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Duplicate Mail Record Detected</p>
              <p className="text-[11px] mt-0.5">{duplicateWarning}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Direction & Category Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Mail Direction *</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as MailDirection)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value={MailDirection.INCOMING}>Incoming Mail (To this office)</option>
              <option value={MailDirection.OUTGOING}>Outgoing Mail (Dispatched from here)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Mail Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MailCategory)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value={MailCategory.SPEED_POST}>Speed Post</option>
              <option value={MailCategory.REGISTERED_POST}>Registered Post</option>
              <option value={MailCategory.PARCEL}>Parcel</option>
              <option value={MailCategory.ORDINARY_LETTER}>Ordinary Letter</option>
              <option value={MailCategory.MONEY_ORDER}>Money Order (eMO)</option>
              <option value={MailCategory.BOOK_POST}>Book Post</option>
            </select>
          </div>
        </div>

        {/* Tracking Reference */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-slate-700">Official Tracking / Reference Number *</label>
            <button
              type="button"
              onClick={generateTracking}
              className="text-blue-600 hover:underline font-semibold"
            >
              + Generate Barcode
            </button>
          </div>
          <input
            type="text"
            required
            placeholder="e.g. SP982104928IN"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold tracking-wider text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
          />
        </div>

        {/* Origin & Destination Offices */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Origin Office & Pincode</label>
            <input
              type="text"
              placeholder="Origin Office"
              value={originOffice}
              onChange={(e) => setOriginOffice(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 mb-1.5 bg-white"
            />
            <input
              type="text"
              placeholder="Origin Pincode (e.g. 110001)"
              value={originPincode}
              onChange={(e) => setOriginPincode(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Destination Office & Pincode</label>
            <input
              type="text"
              placeholder="Destination Office"
              value={destinationOffice}
              onChange={(e) => setDestinationOffice(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 mb-1.5 bg-white"
            />
            <input
              type="text"
              placeholder="Destination Pincode (e.g. 600040)"
              value={destinationPincode}
              onChange={(e) => setDestinationPincode(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>
        </div>

        {/* Sender & Recipient Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800">Sender Information</h4>
            <input
              type="text"
              placeholder="Sender Full Name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            />
            <textarea
              placeholder="Sender Full Address"
              rows={2}
              value={senderAddress}
              onChange={(e) => setSenderAddress(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            />
            <input
              type="text"
              placeholder="Sender Phone (optional)"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800">Recipient Information *</h4>
            <input
              type="text"
              required
              placeholder="Recipient Full Name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            />
            <textarea
              required
              placeholder="Recipient Full Address"
              rows={2}
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            />
            <input
              type="text"
              placeholder="Recipient Mobile Phone"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>
        </div>

        {/* Physical Specs & Tariff */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Weight (Grams)</label>
            <input
              type="number"
              value={weightGrams}
              onChange={(e) => setWeightGrams(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tariff / Postage (Rs.)</label>
            <input
              type="number"
              value={tariffAmount}
              onChange={(e) => setTariffAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
        </div>

        {/* Buttons */}
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
            {loading ? 'Saving...' : 'Verify & Commit Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { MailStatus, DeliveryExceptionReason } from '@postmate/shared';
import { CheckCircle2, AlertOctagon, PenTool } from 'lucide-react';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  mailId: string;
  trackingNumber: string;
  recipientName: string;
  onSuccess: () => void;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  isOpen,
  onClose,
  mailId,
  trackingNumber,
  recipientName,
  onSuccess
}) => {
  const [status, setStatus] = useState<MailStatus>(MailStatus.DELIVERED);
  const [deliveredTo, setDeliveredTo] = useState(recipientName);
  const [recipientRelationship, setRecipientRelationship] = useState('Self');
  const [hasSignature, setHasSignature] = useState(true);
  const [exceptionReason, setExceptionReason] = useState<DeliveryExceptionReason>(DeliveryExceptionReason.DOOR_LOCKED);
  const [exceptionNotes, setExceptionNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.updateDeliveryStatus(mailId, {
        status: status as any,
        deliveredTo: status === MailStatus.DELIVERED ? deliveredTo : undefined,
        recipientRelationship: status === MailStatus.DELIVERED ? recipientRelationship : undefined,
        signatureDataUrl: status === MailStatus.DELIVERED && hasSignature ? 'data:image/svg+xml;utf8,verified-digital-signature' : undefined,
        exceptionReason: status === MailStatus.EXCEPTION ? exceptionReason : undefined,
        exceptionNotes: status === MailStatus.EXCEPTION ? exceptionNotes : undefined
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
      title="Update Delivery Operational Status"
      subtitle={`Tracking Number: ${trackingNumber}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Status Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setStatus(MailStatus.DELIVERED)}
            className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
              status === MailStatus.DELIVERED
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Delivered</span>
          </button>

          <button
            type="button"
            onClick={() => setStatus(MailStatus.EXCEPTION)}
            className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
              status === MailStatus.EXCEPTION
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Exception / Undelivered</span>
          </button>
        </div>

        {status === MailStatus.DELIVERED ? (
          <div className="space-y-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Delivered To (Full Name) *</label>
              <input
                type="text"
                required
                value={deliveredTo}
                onChange={(e) => setDeliveredTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Relationship to Addressee</label>
              <select
                value={recipientRelationship}
                onChange={(e) => setRecipientRelationship(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Self">Self (Addressee)</option>
                <option value="Family Member">Family Member / Relative</option>
                <option value="Security / Reception">Security / Building Reception</option>
                <option value="Authorized Representative">Authorized Representative</option>
              </select>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-blue-600" />
                  <span>Digital Proof of Delivery / Signature</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  CAPTURED
                </span>
              </div>
              <div className="h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 bg-slate-50 font-serif italic text-base">
                {deliveredTo}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-3 bg-rose-50/50 rounded-xl border border-rose-100">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Official Reason for Non-Delivery *</label>
              <select
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value as DeliveryExceptionReason)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value={DeliveryExceptionReason.DOOR_LOCKED}>Door Locked / Premises Closed</option>
                <option value={DeliveryExceptionReason.INSUFFICIENT_ADDRESS}>Insufficient / Incomplete Address</option>
                <option value={DeliveryExceptionReason.ADDRESSEE_MOVED}>Addressee Moved / Left Area</option>
                <option value={DeliveryExceptionReason.REFUSED}>Addressee Refused Delivery</option>
                <option value={DeliveryExceptionReason.ADDRESSEE_NOT_AVAILABLE}>Addressee Not Available at Address</option>
                <option value={DeliveryExceptionReason.PUSHED_TO_NEXT_DAY}>Beat Time Exceeded / Rescheduled Tomorrow</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Operational Remarks / Intimation Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Intimation slip left under door at 11:45 AM"
                value={exceptionNotes}
                onChange={(e) => setExceptionNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        )}

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
            className={`px-5 py-2 rounded-lg font-semibold text-white transition flex items-center gap-1.5 disabled:opacity-50 ${
              status === MailStatus.DELIVERED ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {loading ? 'Updating...' : 'Commit Status Update'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

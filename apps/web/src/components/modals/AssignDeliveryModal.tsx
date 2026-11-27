import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { UserCheck } from 'lucide-react';

interface AssignDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mailId: string;
  trackingNumber: string;
  recipientName: string;
  recipientAddress: string;
  onSuccess: () => void;
}

export const AssignDeliveryModal: React.FC<AssignDeliveryModalProps> = ({
  isOpen,
  onClose,
  mailId,
  trackingNumber,
  recipientName,
  recipientAddress,
  onSuccess
}) => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStaff();
    }
  }, [isOpen]);

  const loadStaff = async () => {
    try {
      const res = await api.getStaffList();
      if (res.success) {
        setStaffList(res.staff || []);
        if (res.staff?.length > 0) {
          setSelectedStaffId(res.staff[0].id);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.assignDelivery(mailId, selectedStaffId);
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
      title="Assign Mail for Beat Delivery"
      subtitle={`Tracking: ${trackingNumber}`}
      maxWidth="md"
    >
      <form onSubmit={handleAssign} className="space-y-4 text-xs">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="font-semibold text-slate-800">Addressee Information</p>
          <p className="text-slate-900 font-bold mt-1">{recipientName}</p>
          <p className="text-slate-600 mt-0.5">{recipientAddress}</p>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Select Delivery Staff Member *</label>
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.employeeId}) — {s.pendingCount || 0} pending tasks
              </option>
            ))}
          </select>
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
            <UserCheck className="w-4 h-4" />
            <span>{loading ? 'Assigning...' : 'Confirm Assignment'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

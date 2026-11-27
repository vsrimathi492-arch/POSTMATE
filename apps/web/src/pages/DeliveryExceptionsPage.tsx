import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge, CategoryBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { UpdateStatusModal } from '../components/modals/UpdateStatusModal';
import { MailStatus, DeliveryExceptionReason } from '@postmate/shared';
import { AlertOctagon, RefreshCw, RotateCcw, MapPin, CheckCircle2 } from 'lucide-react';

export const DeliveryExceptionsPage: React.FC = () => {
  const { t } = useLanguage();

  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMail, setSelectedMail] = useState<any | null>(null);

  useEffect(() => {
    loadExceptions();
  }, []);

  const loadExceptions = async () => {
    setLoading(true);
    try {
      const res = await api.getDeliveries();
      if (res.success) {
        const list = (res.deliveries || []).filter(
          (d: any) => d.status === MailStatus.EXCEPTION
        );
        setExceptions(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.nav.deliveryExceptions}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage undelivered items, door-locked notices, address mismatches, and schedule re-attempts
          </p>
        </div>

        <button
          onClick={loadExceptions}
          className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Exception items */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-semibold">
            {t.common.loading}
          </div>
        ) : exceptions.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Zero Delivery Exceptions"
            description="There are currently no reported delivery exceptions or locked doors requiring re-attempt."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Tracking Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Recipient Name & Address</th>
                  <th className="py-3 px-4">Reported Reason</th>
                  <th className="py-3 px-4">Intimation Remarks</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4 text-right">Re-attempt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exceptions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">
                      {item.trackingNumber}
                    </td>
                    <td className="py-3 px-4">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900">{item.recipientName}</p>
                      <p className="text-slate-500 text-[11px] truncate">{item.recipientAddress}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {item.exceptionReason?.replace(/_/g, ' ') || 'UNSPECIFIED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] italic">
                      {item.exceptionNotes || 'Intimation note given.'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {item.deliveryAttemptCount || 1}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedMail(item)}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
                      >
                        Re-attempt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedMail && (
        <UpdateStatusModal
          isOpen={!!selectedMail}
          onClose={() => setSelectedMail(null)}
          mailId={selectedMail.mailId}
          trackingNumber={selectedMail.trackingNumber}
          recipientName={selectedMail.recipientName}
          onSuccess={loadExceptions}
        />
      )}
    </div>
  );
};

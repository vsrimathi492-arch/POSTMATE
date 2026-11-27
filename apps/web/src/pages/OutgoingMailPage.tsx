import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge, CategoryBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { AddMailModal } from '../components/modals/AddMailModal';
import { MailDirection, MailCategory } from '@postmate/shared';
import { Send, PlusCircle, Search, RefreshCw, Eye } from 'lucide-react';

export const OutgoingMailPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [mailItems, setMailItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    loadOutgoingMail();
  }, []);

  const loadOutgoingMail = async () => {
    setLoading(true);
    try {
      const res = await api.getMailList({
        direction: MailDirection.OUTGOING,
        search: search.trim() || undefined
      });
      if (res.success) {
        setMailItems(res.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.nav.outgoingMail}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Booked at this office for dispatch bag sealing and transit to sorting hubs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadOutgoingMail}
            className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book Outgoing Mail</span>
          </button>
        </div>
      </div>

      {/* Outgoing Mail Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-semibold">
            {t.common.loading}
          </div>
        ) : mailItems.length === 0 ? (
          <EmptyState
            title="No Outgoing Mail Items"
            description="Booked parcels and outward letters will appear here."
            actionText="Book New Outgoing Item"
            onAction={() => setIsAddOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Tracking Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Sender</th>
                  <th className="py-3 px-4">Destination Office</th>
                  <th className="py-3 px-4">Postage Tariff</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mailItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">
                      {item.trackingNumber}
                    </td>
                    <td className="py-3 px-4">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{item.senderName || 'Walk-in Customer'}</p>
                      <p className="text-slate-500 text-[11px] truncate max-w-xs">{item.senderAddress}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{item.destinationOffice}</p>
                      <p className="text-[10px] text-slate-400">PIN: {item.destinationPincode}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      Rs. {item.tariffAmount?.toFixed(2) || '41.00'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.currentStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/mail/${item.id}`)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-slate-100 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddMailModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        initialDirection={MailDirection.OUTGOING}
        onSuccess={loadOutgoingMail}
      />
    </div>
  );
};

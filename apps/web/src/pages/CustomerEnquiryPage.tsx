import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge, CategoryBadge } from '../components/common/StatusBadge';
import { Search, HelpCircle, Phone, Clock, PlusCircle, CheckCircle2, Shield } from 'lucide-react';

export const CustomerEnquiryPage: React.FC = () => {
  const { t } = useLanguage();

  const [trackingInput, setTrackingInput] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [allEnquiries, setAllEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);

  // New enquiry form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [enquiryType, setEnquiryType] = useState<'STATUS_CHECK' | 'DELAY_QUERY' | 'MISDELIVERY_COMPLAINT' | 'GENERAL_QUERY'>('STATUS_CHECK');
  const [subject, setSubject] = useState('Consignment Status Enquiry');
  const [description, setDescription] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [logSuccess, setLogSuccess] = useState(false);

  useEffect(() => {
    loadAllEnquiries();
  }, []);

  const loadAllEnquiries = async () => {
    try {
      const res = await api.getEnquiries();
      if (res.success) setAllEnquiries(res.enquiries || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveEnquiry = async (id: string, status: 'IN_PROGRESS' | 'RESOLVED') => {
    try {
      const res = await api.updateEnquiryResolution(
        id,
        status,
        status === 'RESOLVED' ? 'Customer notified and enquiry closed.' : 'Follow-up initiated with delivery beat.'
      );
      if (res.success) {
        loadAllEnquiries();
        if (trackingInput.trim()) {
          handleSearch({ preventDefault: () => {} } as any);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;

    setLoading(true);
    setSearchResult(null);
    setLogSuccess(false);
    try {
      const res = await api.searchEnquiry(trackingInput.trim());
      if (res.success) {
        setSearchResult(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createEnquiry({
        trackingNumber: trackingInput.trim().toUpperCase(),
        customerName,
        customerPhone,
        enquiryType,
        subject,
        description,
        followUpDate: followUpDate || undefined
      });

      if (res.success) {
        setLogSuccess(true);
        setShowLogForm(false);
        setCustomerName('');
        setCustomerPhone('');
        setDescription('');
        loadAllEnquiries();
        // refresh enquiry result
        handleSearch({ preventDefault: () => {} } as any);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {t.enquiry.title}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Public and customer counter enquiry service with privacy protection masking
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-3">
          <label className="text-xs font-bold text-slate-700 block">
            {t.enquiry.searchPrompt}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="e.g. SP829104812IN or CP402918239IN"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 font-mono uppercase font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Searching...' : t.enquiry.searchBtn}</span>
            </button>
          </div>
        </form>
      </div>

      {logSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Customer enquiry logged successfully into official tracking record.</span>
        </div>
      )}

      {/* Search Result */}
      {searchResult && (
        <div className="space-y-4">
          {searchResult.found ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-lg font-black text-blue-700">
                      {searchResult.record.trackingNumber}
                    </span>
                    <CategoryBadge category={searchResult.record.category} />
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Customer privacy protection active: Private details masked</span>
                  </div>
                </div>
                <StatusBadge status={searchResult.record.currentStatus} />
              </div>

              {/* Status Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Permitted Addressee Info</span>
                  <p className="font-semibold text-slate-900">{searchResult.record.recipientName}</p>
                  {searchResult.record.recipientPhone && (
                    <p className="text-slate-600 text-[11px] mt-0.5">Ph: {searchResult.record.recipientPhone}</p>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Postal Route</span>
                  <p className="text-slate-700 font-medium">{searchResult.record.originOffice} → {searchResult.record.destinationOffice}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Received: {new Date(searchResult.record.receivedDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Status Timeline */}
              {searchResult.record.statusHistory && (
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-2">Transit & Delivery Events</h4>
                  <div className="space-y-2 text-[11px]">
                    {searchResult.record.statusHistory.map((h: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-slate-600">
                        <span className="font-semibold text-slate-800">{h.status.replace(/_/g, ' ')}</span>
                        <span>{h.notes}</span>
                        <span className="text-slate-400">{new Date(h.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setShowLogForm(!showLogForm)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
                >
                  {showLogForm ? 'Close Enquiry Form' : '+ Log Formal Customer Complaint / Query'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs shadow-sm">
              <p className="text-slate-700 font-bold text-sm">No consignment record found for "{trackingInput}"</p>
              <p className="text-slate-500 mt-1">
                Please double check the 13-character tracking reference or verify with the booking office.
              </p>
              <button
                onClick={() => setShowLogForm(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
                Log Non-Receipt Complaint
              </button>
            </div>
          )}

          {/* Log Enquiry Form */}
          {showLogForm && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Record Official Customer Query</h3>
              <form onSubmit={handleLogEnquiry} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Customer Phone Number</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Query Nature</label>
                    <select
                      value={enquiryType}
                      onChange={(e) => setEnquiryType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="STATUS_CHECK">Status Check</option>
                      <option value="DELAY_QUERY">Delay in Delivery Query</option>
                      <option value="MISDELIVERY_COMPLAINT">Misdelivery Complaint</option>
                      <option value="GENERAL_QUERY">General Enquiry</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Subject *</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Description & Customer Request</label>
                  <textarea
                    rows={2}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLogForm(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold"
                  >
                    Submit Enquiry
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Past Enquiry History */}
          {searchResult.enquiryHistory && searchResult.enquiryHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-xs">
              <h4 className="font-bold text-slate-900 mb-3">{t.enquiry.historyTitle}</h4>
              <div className="divide-y divide-slate-100">
                {searchResult.enquiryHistory.map((enq: any) => (
                  <div key={enq.id} className="py-2.5">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{enq.enquiryNumber} ({enq.enquiryType})</span>
                      <span className="text-[10px] text-slate-400">{new Date(enq.enquiryDate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{enq.description}</p>
                    <p className="text-blue-600 text-[10px] mt-1">Resolution: {enq.resolutionStatus}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Office Enquiry Log & Follow-up Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Office Customer Enquiry Register ({allEnquiries.length})
          </h3>
          <span className="text-[11px] text-slate-500">Click a tracking # to inspect status</span>
        </div>

        {allEnquiries.length === 0 ? (
          <p className="text-slate-400 py-4 text-center">No enquiries logged yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {allEnquiries.map((enq) => (
              <div key={enq.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTrackingInput(enq.trackingNumber);
                        api.searchEnquiry(enq.trackingNumber).then(r => r.success && setSearchResult(r));
                      }}
                      className="font-mono font-bold text-blue-700 hover:underline"
                    >
                      {enq.trackingNumber}
                    </button>
                    <span className="font-semibold text-slate-900">{enq.enquiryNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      enq.resolutionStatus === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {enq.resolutionStatus}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium mt-0.5">{enq.subject} — {enq.customerName}</p>
                  {enq.description && <p className="text-slate-500 text-[11px]">{enq.description}</p>}
                </div>

                {enq.resolutionStatus !== 'RESOLVED' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {enq.resolutionStatus === 'OPEN' && (
                      <button
                        type="button"
                        onClick={() => handleResolveEnquiry(enq.id, 'IN_PROGRESS')}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold"
                      >
                        In Progress
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleResolveEnquiry(enq.id, 'RESOLVED')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      Mark Resolved
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

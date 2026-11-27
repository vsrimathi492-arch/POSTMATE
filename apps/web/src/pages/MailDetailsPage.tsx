import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge, CategoryBadge } from '../components/common/StatusBadge';
import { AssignDeliveryModal } from '../components/modals/AssignDeliveryModal';
import { UpdateStatusModal } from '../components/modals/UpdateStatusModal';
import { MailStatus, IMailRecord } from '@postmate/shared';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  Package,
  FileText
} from 'lucide-react';

export const MailDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [mail, setMail] = useState<IMailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  useEffect(() => {
    if (id) loadMailDetails();
  }, [id]);

  const loadMailDetails = async () => {
    setLoading(true);
    try {
      const res = await api.getMailById(id!);
      if (res.success) {
        setMail(res.mail);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-500 font-semibold">
        {t.common.loading}
      </div>
    );
  }

  if (!mail) {
    return (
      <div className="text-center py-16">
        <p className="text-sm font-semibold text-slate-700">Mail record not found.</p>
        <button
          onClick={() => navigate('/register')}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          Back to Register
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-black text-slate-900 tracking-wider">
                {mail.trackingNumber}
              </span>
              <CategoryBadge category={mail.category} />
              <StatusBadge status={mail.currentStatus} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Record ID: {mail.id} • Registered: {new Date(mail.receivedDate).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mail.currentStatus !== MailStatus.DELIVERED && (
            <>
              <button
                onClick={() => setIsAssignOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Assign Postman</span>
              </button>
              <button
                onClick={() => setIsUpdateOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Update Delivery Status</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Origin/Destination, Addressee Details & Lifecycle History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Addressee and Sender Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Consignment & Party Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Sender (Origin)
                </span>
                <p className="text-sm font-bold text-slate-900">{mail.senderName || 'Sender Unspecified'}</p>
                <p className="text-slate-600 mt-1 whitespace-pre-line">{mail.senderAddress || 'Walk-in booking counter'}</p>
                {mail.senderPhone && <p className="text-slate-500 mt-2">Ph: {mail.senderPhone}</p>}
                <div className="mt-3 pt-2 border-t border-slate-200 text-slate-500 text-[11px]">
                  Origin: <strong>{mail.originOffice}</strong> ({mail.originPincode})
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                  Recipient (Destination Addressee)
                </span>
                <p className="text-sm font-bold text-slate-900">{mail.recipientName}</p>
                <p className="text-slate-700 mt-1 whitespace-pre-line">{mail.recipientAddress}</p>
                {mail.recipientPhone && <p className="text-slate-600 mt-2">Ph: {mail.recipientPhone}</p>}
                <div className="mt-3 pt-2 border-t border-blue-200 text-slate-600 text-[11px]">
                  Destination: <strong>{mail.destinationOffice}</strong> ({mail.destinationPincode})
                </div>
              </div>
            </div>
          </div>

          {/* Complete Status Lifecycle History (Single-Source-of-Truth) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Full Operational Status Lifecycle History</span>
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {mail.statusHistory?.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
                  <div className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {step.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(step.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{step.notes}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      Updated By: {step.updatedByName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Metadata & Proof Information */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Physical & Tariff Specs</h3>

            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Weight:</span>
                <span className="font-semibold text-slate-800">{mail.weightGrams || 150} g</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Tariff / Postage:</span>
                <span className="font-mono font-bold text-slate-900">Rs. {mail.tariffAmount?.toFixed(2) || '41.00'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Delivery Attempts:</span>
                <span className="font-semibold text-slate-800">{mail.deliveryAttemptCount || 0}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Assigned Postman:</span>
                <span className="font-semibold text-blue-700">{mail.assignedStaffName || 'Not Assigned'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Verification Source:</span>
                <span className="font-semibold text-slate-800">{mail.verificationSource || 'Verified Manual Entry'}</span>
              </div>
            </div>
          </div>

          {/* Delivery Outcome / Signature Proof */}
          {mail.currentStatus === MailStatus.DELIVERED && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 shadow-sm text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Official Delivery Proof Verified</span>
              </div>
              <p className="text-slate-700">Delivered To: <strong>{mail.deliveredTo || mail.recipientName}</strong></p>
              <p className="text-slate-500 text-[11px]">
                Timestamp: {mail.deliveredTimestamp ? new Date(mail.deliveredTimestamp).toLocaleString() : 'Today'}
              </p>
              {mail.digitalSignature && (
                <div className="mt-2 p-2 bg-white rounded border border-emerald-200 text-center font-serif italic text-slate-500">
                  {mail.deliveredTo || 'Digital Signature Stamped'}
                </div>
              )}
            </div>
          )}

          {mail.currentStatus === MailStatus.EXCEPTION && (
            <div className="bg-rose-50 rounded-2xl border border-rose-200 p-5 shadow-sm text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Delivery Exception Logged</span>
              </div>
              <p className="text-slate-700">
                Reason: <strong>{mail.deliveryExceptionReason}</strong>
              </p>
              <p className="text-slate-600 text-[11px]">{mail.deliveryNotes}</p>
            </div>
          )}
        </div>
      </div>

      <AssignDeliveryModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        mailId={mail.id}
        trackingNumber={mail.trackingNumber}
        recipientName={mail.recipientName}
        recipientAddress={mail.recipientAddress}
        onSuccess={loadMailDetails}
      />

      <UpdateStatusModal
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        mailId={mail.id}
        trackingNumber={mail.trackingNumber}
        recipientName={mail.recipientName}
        onSuccess={loadMailDetails}
      />
    </div>
  );
};

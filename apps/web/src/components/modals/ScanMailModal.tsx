import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { MailCategory, MailDirection } from '@postmate/shared';
import {
  Scan,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface ScanMailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScanMailModal: React.FC<ScanMailModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateRecord, setDuplicateRecord] = useState<any | null>(null);
  const [staffVerified, setStaffVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulateScan = async (codePreset?: string) => {
    setIsScanning(true);
    setError(null);
    setIsDuplicate(false);
    setStaffVerified(false);

    const targetCode = codePreset || 'SP' + Math.floor(100000000 + Math.random() * 900000000) + 'IN';
    setBarcodeInput(targetCode);

    setTimeout(async () => {
      setIsScanning(false);
      try {
        const ocrRes = await api.extractOcr(targetCode);
        if (ocrRes.success) {
          setExtractedData(ocrRes.extractedData);
          setIsDuplicate(ocrRes.isDuplicate);
          setDuplicateRecord(ocrRes.existingRecord);
        }
      } catch (err: any) {
        setError(err.message || 'Scanning processing error');
      }
    }, 800);
  };

  const handleManualBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const scanRes = await api.scanBarcode(barcodeInput.trim());
      if (scanRes.success) {
        setIsDuplicate(scanRes.isDuplicate);
        setDuplicateRecord(scanRes.existingRecord);

        // Fetch OCR simulation
        const ocrRes = await api.extractOcr(barcodeInput.trim());
        setExtractedData({
          ...ocrRes.extractedData,
          trackingNumber: scanRes.barcode,
          category: scanRes.inferredCategory
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error processing barcode');
    } finally {
      setLoading(false);
    }
  };

  const handleCommitRecord = async () => {
    if (!extractedData) return;
    if (!staffVerified) {
      setError('Staff verification checkbox is required before committing OCR extracted record.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.createMail({
        trackingNumber: extractedData.trackingNumber,
        direction: extractedData.direction || MailDirection.INCOMING,
        category: extractedData.category || MailCategory.SPEED_POST,
        originOffice: extractedData.senderAddress?.split(',')[1]?.trim() || 'New Delhi GPO',
        originPincode: '110001',
        destinationOffice: 'Anna Nagar Sub Post Office',
        destinationPincode: extractedData.destinationPincode || '600040',
        senderName: extractedData.senderName || 'Sender',
        senderAddress: extractedData.senderAddress || 'Sender Address',
        recipientName: extractedData.recipientName,
        recipientAddress: extractedData.recipientAddress,
        weightGrams: extractedData.weightGrams || 150,
        tariffAmount: 41,
        verificationSource: 'OCR_VERIFIED'
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else if (res.isDuplicate) {
        setIsDuplicate(true);
        setDuplicateRecord(res.duplicateRecord);
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
      title="Smart Mail Scanning & Verification"
      subtitle="Camera & Barcode Scanner + Assisted OCR Field Extraction"
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Scanner Simulation Viewport */}
        <div className="relative rounded-2xl bg-slate-950 p-6 text-white text-center border border-slate-800 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

          {/* Aiming Reticle */}
          <div className="relative z-10 max-w-xs mx-auto border-2 border-dashed border-blue-400 rounded-xl p-6 bg-slate-900/60 backdrop-blur-sm">
            <Scan className={`w-10 h-10 mx-auto mb-2 ${isScanning ? 'text-emerald-400 animate-spin' : 'text-blue-400'}`} />
            <p className="font-semibold text-slate-200">
              {isScanning ? 'Analyzing Postal Label & Barcode...' : 'Position Barcode / Address Label in Frame'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Supports 1D Code128, 2D QR Code & Postal Consignment Numbers
            </p>

            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => simulateScan()}
                disabled={isScanning}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-xs flex items-center gap-1.5 transition shadow"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Simulate Camera Scan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Manual Barcode Fallback Input */}
        <form onSubmit={handleManualBarcodeScan} className="flex gap-2">
          <input
            type="text"
            placeholder="Or enter 13-digit tracking reference barcode manually..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
          >
            Process Code
          </button>
        </form>

        {/* Duplicate Warning Alert */}
        {isDuplicate && duplicateRecord && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Duplicate Mail Record Warning!</p>
              <p className="text-[11px] mt-0.5">
                Item <strong>{duplicateRecord.trackingNumber}</strong> is already registered with status <strong>{duplicateRecord.currentStatus}</strong>.
                Central record was not duplicated.
              </p>
            </div>
          </div>
        )}

        {/* Extracted OCR Information Verification Card */}
        {extractedData && (
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900">Extracted Postal Fields (Assistive OCR)</span>
              </div>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Confidence: {Math.round((extractedData.confidenceScore || 0.94) * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Tracking Number:</span>
                <input
                  type="text"
                  value={extractedData.trackingNumber}
                  onChange={(e) => setExtractedData({ ...extractedData, trackingNumber: e.target.value })}
                  className="w-full px-2 py-1 rounded border border-slate-300 font-mono font-bold bg-white"
                />
              </div>
              <div>
                <span className="text-slate-500 block">Category:</span>
                <select
                  value={extractedData.category}
                  onChange={(e) => setExtractedData({ ...extractedData, category: e.target.value })}
                  className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
                >
                  <option value={MailCategory.SPEED_POST}>Speed Post</option>
                  <option value={MailCategory.REGISTERED_POST}>Registered Post</option>
                  <option value={MailCategory.PARCEL}>Parcel</option>
                  <option value={MailCategory.ORDINARY_LETTER}>Ordinary Letter</option>
                </select>
              </div>

              <div className="col-span-2">
                <span className="text-slate-500 block">Recipient Name & Address:</span>
                <input
                  type="text"
                  value={extractedData.recipientName}
                  onChange={(e) => setExtractedData({ ...extractedData, recipientName: e.target.value })}
                  className="w-full px-2 py-1 rounded border border-slate-300 mb-1 bg-white"
                />
                <textarea
                  rows={2}
                  value={extractedData.recipientAddress}
                  onChange={(e) => setExtractedData({ ...extractedData, recipientAddress: e.target.value })}
                  className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
                />
              </div>

              <div>
                <span className="text-slate-500 block">Destination Pincode:</span>
                <input
                  type="text"
                  value={extractedData.destinationPincode}
                  onChange={(e) => setExtractedData({ ...extractedData, destinationPincode: e.target.value })}
                  className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
                />
              </div>
              <div>
                <span className="text-slate-500 block">Weight (Grams):</span>
                <input
                  type="number"
                  value={extractedData.weightGrams}
                  onChange={(e) => setExtractedData({ ...extractedData, weightGrams: Number(e.target.value) })}
                  className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
                />
              </div>
            </div>

            {/* Mandatory Staff Verification Checkbox */}
            <div className="pt-2 border-t border-blue-200">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={staffVerified}
                  onChange={(e) => setStaffVerified(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>I have physically inspected the parcel label and verify these extracted fields are correct.</span>
              </label>
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
            type="button"
            onClick={handleCommitRecord}
            disabled={loading || !extractedData || !staffVerified}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Committing...' : 'Commit Verified Record'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

import React, { useState } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { MailCategory, MailDirection } from '@postmate/shared';
import {
  ScanLine,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const SmartScanPage: React.FC = () => {
  const { t } = useLanguage();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [ocrRawText, setOcrRawText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateRecord, setDuplicateRecord] = useState<any | null>(null);
  const [staffVerified, setStaffVerified] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const simulateScan = (prefix = 'SP') => {
    setIsScanning(true);
    setError(null);
    setSuccessMessage(null);
    setIsDuplicate(false);
    setStaffVerified(false);

    const generated = prefix + Math.floor(100000000 + Math.random() * 900000000) + 'IN';
    setBarcodeInput(generated);

    setTimeout(async () => {
      setIsScanning(false);
      try {
        const ocrRes = await api.extractOcr(generated);
        if (ocrRes.success) {
          setExtractedData(ocrRes.extractedData);
          setIsDuplicate(ocrRes.isDuplicate);
          setDuplicateRecord(ocrRes.existingRecord);
        }
      } catch (err: any) {
        setError(err.message);
      }
    }, 700);
  };

  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const scanRes = await api.scanBarcode(barcodeInput.trim());
      if (scanRes.success) {
        setIsDuplicate(scanRes.isDuplicate);
        setDuplicateRecord(scanRes.existingRecord);

        const ocrRes = await api.extractOcr(barcodeInput.trim());
        setExtractedData({
          ...ocrRes.extractedData,
          trackingNumber: scanRes.barcode,
          category: scanRes.inferredCategory
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCommitRecord = async () => {
    if (!extractedData) return;
    if (!staffVerified) {
      setError('You must check the verification box confirming physical label verification.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.createMail({
        trackingNumber: extractedData.trackingNumber,
        direction: extractedData.direction || MailDirection.INCOMING,
        category: extractedData.category || MailCategory.SPEED_POST,
        originOffice: 'New Delhi GPO',
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
        setSuccessMessage(`Consignment ${extractedData.trackingNumber} successfully verified & entered into central register.`);
        setExtractedData(null);
        setBarcodeInput('');
        setStaffVerified(false);
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
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {t.nav.smartScanning}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Barcode Scanner & OCR Text Extraction — One-time data capture with mandatory staff verification
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive Scanner Terminal */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="relative rounded-2xl bg-slate-950 p-8 text-white text-center border border-slate-800 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

            <div className="relative z-10 max-w-sm mx-auto border-2 border-dashed border-blue-400 rounded-xl p-6 bg-slate-900/70 backdrop-blur-sm">
              <ScanLine className={`w-12 h-12 mx-auto mb-3 ${isScanning ? 'text-emerald-400 animate-spin' : 'text-blue-400'}`} />
              <p className="font-bold text-sm text-slate-100">
                {isScanning ? 'Decoding Barcode & Parcel Label...' : 'Ready for Scanning'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Scan consignment barcode or extract address details with OCR
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => simulateScan('SP')}
                  disabled={isScanning}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-xs transition"
                >
                  Scan Speed Post
                </button>
                <button
                  type="button"
                  onClick={() => simulateScan('RP')}
                  disabled={isScanning}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs transition"
                >
                  Scan Reg Post
                </button>
                <button
                  type="button"
                  onClick={() => simulateScan('CP')}
                  disabled={isScanning}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 font-semibold text-xs transition"
                >
                  Scan Parcel
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleManualScan} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Manual Barcode Input / Wedge Scanner</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Scan or type barcode (e.g. SP829104812IN)"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold uppercase text-xs"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
                >
                  Inspect
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="font-semibold text-slate-700 block mb-1">
                OCR Label Text Assist (Paste Address Label Text)
              </label>
              <textarea
                rows={3}
                placeholder={'Example:\nSP912345678IN\nTo: R. Karthikeyan\nAddress: 18, 4th Main Road, Anna Nagar, Chennai 600040\n240g'}
                value={ocrRawText}
                onChange={(e) => setOcrRawText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                disabled={!ocrRawText.trim() || loading}
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  setSuccessMessage(null);
                  setStaffVerified(false);
                  try {
                    const ocrRes = await api.extractOcr(ocrRawText);
                    if (ocrRes.success) {
                      setExtractedData(ocrRes.extractedData);
                      setIsDuplicate(ocrRes.isDuplicate);
                      setDuplicateRecord(ocrRes.existingRecord);
                    }
                  } catch (err: any) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="mt-2 px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs transition disabled:opacity-50"
              >
                Extract Fields from Label Text
              </button>
            </div>
          </form>

          {isDuplicate && duplicateRecord && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-bold">Duplicate Item Detected</p>
                <p className="mt-0.5 text-[11px]">
                  Consignment <strong>{duplicateRecord.trackingNumber}</strong> is already recorded in the system.
                  Current Status: <strong>{duplicateRecord.currentStatus}</strong>.
                </p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Right: Verification & Commit Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Extracted Postal Information</h3>
              </div>
              {extractedData && (
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Confidence: {Math.round((extractedData.confidenceScore || 0.94) * 100)}%
                </span>
              )}
            </div>

            {!extractedData ? (
              <div className="py-20 text-center text-slate-400">
                <p className="font-medium">Scan an item or enter a barcode to review extracted fields.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Extracted information will populate here for mandatory staff check.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Tracking Number:</span>
                    <input
                      type="text"
                      value={extractedData.trackingNumber}
                      onChange={(e) => setExtractedData({ ...extractedData, trackingNumber: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold bg-white"
                    />
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Category:</span>
                    <select
                      value={extractedData.category}
                      onChange={(e) => setExtractedData({ ...extractedData, category: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                    >
                      <option value={MailCategory.SPEED_POST}>Speed Post</option>
                      <option value={MailCategory.REGISTERED_POST}>Registered Post</option>
                      <option value={MailCategory.PARCEL}>Parcel</option>
                    </select>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Addressee / Recipient Name:</span>
                  <input
                    type="text"
                    value={extractedData.recipientName}
                    onChange={(e) => setExtractedData({ ...extractedData, recipientName: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                  />
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Recipient Address:</span>
                  <textarea
                    rows={2}
                    value={extractedData.recipientAddress}
                    onChange={(e) => setExtractedData({ ...extractedData, recipientAddress: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Destination Pincode:</span>
                    <input
                      type="text"
                      value={extractedData.destinationPincode}
                      onChange={(e) => setExtractedData({ ...extractedData, destinationPincode: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Weight (Grams):</span>
                    <input
                      type="number"
                      value={extractedData.weightGrams}
                      onChange={(e) => setExtractedData({ ...extractedData, weightGrams: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={staffVerified}
                      onChange={(e) => setStaffVerified(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>I have verified that all extracted fields match the physical parcel label.</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 mt-4 flex items-center justify-end">
            <button
              onClick={handleCommitRecord}
              disabled={loading || !extractedData || !staffVerified}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Committing...' : 'Commit to Central Register'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

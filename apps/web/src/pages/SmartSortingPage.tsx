import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { CategoryBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { MailCategory } from '@postmate/shared';
import {
  Boxes,
  MapPin,
  CheckCircle2,
  FolderPlus,
  RefreshCw,
  Layers,
  AlertTriangle,
  Pencil
} from 'lucide-react';

export const SmartSortingPage: React.FC = () => {
  const { t } = useLanguage();

  const [groups, setGroups] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [groupBy, setGroupBy] = useState<'destination' | 'category'>('destination');
  const [loading, setLoading] = useState(true);
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editArea, setEditArea] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editCategory, setEditCategory] = useState<MailCategory>(MailCategory.SPEED_POST);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadSortingData();
  }, [groupBy]);

  const loadSortingData = async () => {
    setLoading(true);
    try {
      const [suggRes, batchRes] = await Promise.all([
        api.getSortingSuggestions(groupBy),
        api.getSortingBatches()
      ]);

      if (suggRes.success) setGroups(suggRes.groups || []);
      if (batchRes.success) setBatches(batchRes.batches || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (group: any) => {
    setCreatingBatch(true);
    try {
      const itemIds = group.items.map((i: any) => i.id);
      const res = await api.createSortingBatch({
        destinationArea: group.destinationArea,
        destinationPincodes: [group.pincode],
        category: group.category,
        mailItemIds: itemIds,
        notes: `Smart batch (${groupBy}) created for ${group.destinationArea}`
      });

      if (res.success) {
        loadSortingData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingBatch(false);
    }
  };

  const handleVerifyBatch = async (batch: any) => {
    try {
      const res = await api.updateSortingBatch(batch.id, {
        status: 'VERIFIED',
        verifiedItems: batch.totalItems,
        notes: 'Batch physically verified and sealed for dispatch/delivery.'
      });
      if (res.success) loadSortingData();
    } catch (e) {
      console.error(e);
    }
  };

  const openCorrection = (item: any) => {
    setEditingItem(item);
    setEditArea(item.sortingArea || '');
    setEditPincode(item.destinationPincode || '');
    setEditCategory(item.category || MailCategory.SPEED_POST);
  };

  const saveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingEdit(true);
    try {
      const res = await api.updateMail(editingItem.id, {
        sortingArea: editArea.trim(),
        destinationPincode: editPincode.trim(),
        category: editCategory
      });
      if (res.success) {
        setEditingItem(null);
        loadSortingData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.nav.smartSorting}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Group mail by verified destination area or mail category; manually verify ambiguous items before sealing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setGroupBy('destination')}
              className={`px-3 py-1 rounded-lg transition ${
                groupBy === 'destination' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              By Destination / Beat
            </button>
            <button
              onClick={() => setGroupBy('category')}
              className={`px-3 py-1 rounded-lg transition ${
                groupBy === 'category' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              By Mail Category
            </button>
          </div>
          <button
            onClick={loadSortingData}
            className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
            title="Refresh Sorting Suggestions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Two Column Layout: Unsorted Groups vs Active Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Suggested Area & Beat Groups */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>
                {groupBy === 'category' ? 'Mail-Category Grouping Suggestions' : 'Destination Area & Beat Grouping Suggestions'}
              </span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {groups.length} Sorting Groups
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 font-semibold">
              {t.common.loading}
            </div>
          ) : groups.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All Scanned Mail Sorted"
              description="No unassigned or unsorted mail items waiting in the sorting hall."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map((group, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-400 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{group.destinationArea}</h4>
                          <span className="text-[10px] text-slate-500">PIN: {group.pincode}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                        {group.totalItems} items
                      </span>
                    </div>

                    {group.needsVerification && (
                      <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span>Incomplete beat/area info — verify or correct before batching</span>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                      {group.items.slice(0, 4).map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between text-[11px] gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono font-bold text-slate-700">{item.trackingNumber}</span>
                            <CategoryBadge category={item.category} />
                          </div>
                          <button
                            type="button"
                            onClick={() => openCorrection(item)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 flex-shrink-0"
                            title="Manual Correction"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {group.items.length > 4 && (
                        <p className="text-[10px] text-slate-400 italic">
                          +{group.items.length - 4} more items in this group
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCreateBatch(group)}
                    disabled={creatingBatch}
                    className="mt-4 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Create Sorting Batch ({group.totalItems})</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Active & Completed Sorting Batches */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Sorting Batches History</h3>

          {batches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center text-xs text-slate-400">
              No sorting batches generated today. Create a batch from the groups on the left.
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-[11px]">
                      {batch.batchNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      batch.status === 'VERIFIED' || batch.status === 'CLOSED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {batch.status}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-800">{batch.destinationArea}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>Items: <strong>{batch.totalItems}</strong></span>
                    <span>Created by: {batch.createdByName}</span>
                  </div>

                  {batch.status === 'OPEN' && (
                    <button
                      onClick={() => handleVerifyBatch(batch)}
                      className="w-full mt-1 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] transition flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify & Seal Sorting Batch</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manual Correction Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 text-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Manual Sorting Correction</h3>
              <p className="text-[11px] text-slate-500">
                Verify and update sorting details for <strong className="font-mono text-blue-700">{editingItem.trackingNumber}</strong>
              </p>
            </div>
            <form onSubmit={saveCorrection} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sorting Area / Beat</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anna Nagar West Beat 2"
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Destination Pincode</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={editPincode}
                  onChange={(e) => setEditPincode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mail Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as MailCategory)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value={MailCategory.SPEED_POST}>Speed Post</option>
                  <option value={MailCategory.REGISTERED_POST}>Registered Post</option>
                  <option value={MailCategory.PARCEL}>Parcel</option>
                  <option value={MailCategory.ORDINARY_LETTER}>Ordinary Letter</option>
                  <option value={MailCategory.BOOK_POST}>Book Post</option>
                  <option value={MailCategory.MONEY_ORDER}>Money Order</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {savingEdit ? 'Saving...' : 'Save Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

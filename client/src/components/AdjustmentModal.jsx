import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';

export default function AdjustmentModal({ quotation, onClose, onSubmit }) {
  if (!quotation) return null;

  const originalTotal = quotation.originalQuotationSnapshot?.grandTotal || quotation.grandTotal;

  const [items, setItems] = useState(
    (quotation.items || []).map(it => ({
      ...it,
      quantity: it.quantity || 1,
      unitPrice: it.unitPrice || 0,
      discountPercent: it.discountPercent || 0,
      taxPercent: it.taxPercent || 0
    }))
  );

  const [reason, setReason] = useState('');
  const [adjustedBy, setAdjustedBy] = useState('Sales Executive');
  const [requireReApproval, setRequireReApproval] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        itemCode: `ITM-0${items.length + 1}`,
        description: '',
        unit: 'Nos',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        taxPercent: 0
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Live recalculations
  const calculatedItems = items.map((it) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unitPrice) || 0;
    const disc = Number(it.discountPercent) || 0;
    const tax = Number(it.taxPercent) || 0;
    const base = qty * price;
    const discVal = (base * disc) / 100;
    const taxVal = ((base - discVal) * tax) / 100;
    const total = Math.round((base - discVal + taxVal) * 100) / 100;
    return { ...it, total };
  });

  const newSubtotal = calculatedItems.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unitPrice)), 0);
  const newTotalDiscount = calculatedItems.reduce((sum, it) => {
    const base = Number(it.quantity) * Number(it.unitPrice);
    return sum + ((base * (Number(it.discountPercent) || 0)) / 100);
  }, 0);
  const newTaxAmount = calculatedItems.reduce((sum, it) => {
    const base = Number(it.quantity) * Number(it.unitPrice);
    const discVal = (base * (Number(it.discountPercent) || 0)) / 100;
    return sum + (((base - discVal) * (Number(it.taxPercent) || 0)) / 100);
  }, 0);
  const newGrandTotal = Math.round((newSubtotal - newTotalDiscount + newTaxAmount) * 100) / 100;

  const difference = newGrandTotal - originalTotal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please specify the reason for the customer adjustment (e.g. client requested 5% discount, reduced attendees).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        items: calculatedItems,
        reason,
        adjustedBy,
        requireReApproval
      });
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-indigo-900 text-white flex items-center justify-between border-b border-indigo-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-600 rounded-lg">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Record Customer Adjustment</h3>
              <p className="text-xs text-indigo-200">
                Track modifications made to {quotation.quotationNumber} while preserving the original quotation snapshot
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-indigo-200 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Comparison summary header bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Original Quotation Total (v1)
              </span>
              <span className="text-base font-bold text-slate-800 font-mono mt-1 block">
                Rs. {formatCurrency(originalTotal)}
              </span>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                Adjusted Quotation Total (v{(quotation.version || 1) + 1})
              </span>
              <span className="text-base font-bold text-blue-900 font-mono mt-1 block">
                Rs. {formatCurrency(newGrandTotal)}
              </span>
            </div>

            <div className={`p-3 rounded-xl border ${
              difference < 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-600">
                Variance / Adjustment Impact
              </span>
              <span className={`text-base font-bold font-mono mt-1 flex items-center gap-1 ${
                difference < 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}>
                {difference < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {difference < 0 ? `- Rs. ${formatCurrency(Math.abs(difference))}` : `+ Rs. ${formatCurrency(difference)}`}
              </span>
            </div>
          </div>

          {/* Reason and Performer Inputs */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Adjustment / Client Feedback *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer requested a 5% discount on venue and reduced room nights to 20"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Adjusted By (Staff Name)
                </label>
                <input
                  type="text"
                  value={adjustedBy}
                  onChange={(e) => setAdjustedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="requireReApproval"
                checked={requireReApproval}
                onChange={(e) => setRequireReApproval(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="requireReApproval" className="text-slate-700 font-semibold cursor-pointer flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Require Admin re-authorization before re-transmitting to customer</span>
              </label>
            </div>
          </div>

          {/* Editable Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                Adjust Line Items & Pricing
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-2 w-20 text-center">Unit</th>
                    <th className="py-2.5 px-2 w-20 text-right">Qty</th>
                    <th className="py-2.5 px-2 w-28 text-right">Unit Price (Rs.)</th>
                    <th className="py-2.5 px-2 w-20 text-right">Disc %</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total (Rs.)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calculatedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-center"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-right font-mono"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-right font-mono"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => handleItemChange(idx, 'discountPercent', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-right font-mono text-rose-600"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 text-[11px]">
              This will create Revision v{(quotation.version || 1) + 1} and preserve original quote.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Recording...' : 'Save & Log Revision'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


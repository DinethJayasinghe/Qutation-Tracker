import React from 'react';
import { 
  X, 
  GitCompare, 
  ArrowRight, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2, 
  RotateCcw,
  Calendar,
  User
} from 'lucide-react';

export default function ComparisonViewModal({ quotation, onClose }) {
  if (!quotation) return null;

  const original = quotation.originalQuotationSnapshot || {
    items: quotation.items,
    subtotal: quotation.subtotal,
    totalDiscount: quotation.totalDiscount,
    grandTotal: quotation.grandTotal,
    date: quotation.date
  };

  const current = quotation;

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const origTotal = Number(original.grandTotal || 0);
  const currTotal = Number(current.grandTotal || 0);
  const diff = currTotal - origTotal;
  const pctChange = origTotal > 0 ? ((diff / origTotal) * 100).toFixed(1) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-600 rounded-lg">
              <GitCompare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Quotation Adjustment Diff</h3>
              <p className="text-xs text-slate-300">
                Comparing Original Quotation (v1.0) vs Adjusted Revision (v{current.version || 2}) for {quotation.quotationNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Top Diff KPI Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Original Quotation Total
              </span>
              <div className="text-lg font-extrabold text-slate-800 font-mono mt-1">
                Rs. {formatCurrency(origTotal)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Issued on {original.date ? new Date(original.date).toLocaleDateString('en-GB') : 'Initial submission'}
              </span>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl text-center">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
                Current Adjusted Total (v{current.version || 2})
              </span>
              <div className="text-lg font-extrabold text-indigo-900 font-mono mt-1">
                Rs. {formatCurrency(currTotal)}
              </div>
              <span className="text-[10px] text-indigo-500 mt-0.5 block">
                Reflecting client negotiations
              </span>
            </div>

            <div className={`p-3.5 rounded-xl border text-center ${
              diff < 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-600">
                Net Variance
              </span>
              <div className={`text-lg font-extrabold font-mono mt-1 flex items-center justify-center gap-1 ${
                diff < 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}>
                {diff < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {diff < 0 ? `- Rs. ${formatCurrency(Math.abs(diff))}` : `+ Rs. ${formatCurrency(diff)}`}
              </div>
              <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">
                {diff < 0 ? `Customer saved ${Math.abs(pctChange)}%` : `Scope increased by ${pctChange}%`}
              </span>
            </div>
          </div>

          {/* Side by Side Line Items Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Original Version */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <div className="bg-slate-200/80 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between border-b border-slate-200">
                <span>Original Version (v1.0)</span>
                <span className="font-mono text-slate-600 font-normal text-[11px]">
                  Rs. {formatCurrency(origTotal)}
                </span>
              </div>
              <div className="divide-y divide-slate-200/70">
                {(original.items || []).map((it, idx) => (
                  <div key={idx} className="p-3 bg-white space-y-1">
                    <div className="font-semibold text-slate-800 flex justify-between">
                      <span>{it.description}</span>
                      <span className="font-mono text-slate-900 font-bold">Rs. {formatCurrency(it.total)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Qty: {it.quantity} {it.unit || 'Nos'} @ Rs. {formatCurrency(it.unitPrice)}</span>
                      {Number(it.discountPercent) > 0 && (
                        <span className="text-rose-600 font-semibold">{it.discountPercent}% Disc</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Adjusted Version */}
            <div className="border border-indigo-200 rounded-xl overflow-hidden bg-indigo-50/30">
              <div className="bg-indigo-100 px-4 py-2.5 font-bold text-indigo-900 flex items-center justify-between border-b border-indigo-200">
                <span>Adjusted Version (v{current.version || 2})</span>
                <span className="font-mono text-indigo-800 font-bold text-[11px]">
                  Rs. {formatCurrency(currTotal)}
                </span>
              </div>
              <div className="divide-y divide-indigo-100">
                {(current.items || []).map((it, idx) => {
                  const origMatch = (original.items || [])[idx];
                  const isModified = origMatch && (origMatch.quantity !== it.quantity || origMatch.unitPrice !== it.unitPrice || origMatch.discountPercent !== it.discountPercent || origMatch.total !== it.total);

                  return (
                    <div key={idx} className={`p-3 space-y-1 ${isModified ? 'bg-indigo-50/80 border-l-4 border-indigo-500' : 'bg-white'}`}>
                      <div className="font-semibold text-slate-800 flex justify-between">
                        <span className="flex items-center gap-1.5">
                          {it.description}
                          {isModified && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-indigo-200 text-indigo-900 rounded">
                              Adjusted
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-indigo-900 font-bold">Rs. {formatCurrency(it.total)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Qty: {it.quantity} {it.unit || 'Nos'} @ Rs. {formatCurrency(it.unitPrice)}</span>
                        {Number(it.discountPercent) > 0 && (
                          <span className="text-rose-600 font-semibold">{it.discountPercent}% Disc</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Audit Log Timeline */}
          {quotation.adjustments && quotation.adjustments.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-slate-600" />
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                  Recorded Revision Log History
                </h4>
              </div>

              <div className="space-y-2">
                {quotation.adjustments.map((adj, index) => (
                  <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Revision #{adj.version}</span>
                        <span className="text-slate-400 text-[10px]">
                          {adj.adjustedAt ? new Date(adj.adjustedAt).toLocaleString('en-GB') : 'Recorded'}
                        </span>
                        <span className="text-slate-400 text-[10px]">• By {adj.adjustedBy || 'Staff'}</span>
                      </div>
                      <p className="text-slate-700 font-medium text-[11px] mt-1">
                        <strong>Reason:</strong> {adj.reason}
                      </p>
                      <p className="text-slate-500 text-[10px] mt-0.5 italic">
                        {adj.changesSummary}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0 font-mono text-xs">
                      <div className="font-bold text-slate-900">
                        Rs. {formatCurrency(adj.newGrandTotal)}
                      </div>
                      <div className={`text-[10px] font-semibold ${adj.difference < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {adj.difference < 0 ? '-' : '+'}Rs. {formatCurrency(Math.abs(adj.difference))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg"
            >
              Close Comparison
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


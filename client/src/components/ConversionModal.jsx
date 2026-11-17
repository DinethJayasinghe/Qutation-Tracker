import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  DollarSign, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

export default function ConversionModal({ quotation, onClose, onSubmit }) {
  if (!quotation) return null;

  const [isConverted, setIsConverted] = useState(true);
  const [finalValue, setFinalValue] = useState(quotation.grandTotal || 0);
  const [clientFeedback, setClientFeedback] = useState('');
  const [lostReason, setLostReason] = useState('Client selected alternate venue due to budget constraints');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        isConverted,
        finalValue: Number(finalValue),
        clientFeedback,
        lostReason
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
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Record Business Outcome</h3>
              <p className="text-xs text-slate-300">
                Track whether {quotation.quotationNumber} converted into business or not
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Outcome Choice Radio Buttons */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">
              Did this quotation convert into business?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsConverted(true)}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                  isConverted
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm ring-2 ring-emerald-500'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-full">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold block text-sm">Converted to Business</span>
                  <span className="text-[11px] text-slate-500">Customer accepted & confirmed</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsConverted(false)}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                  !isConverted
                    ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-sm ring-2 ring-rose-500'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="p-2 bg-rose-100 text-rose-700 rounded-full">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold block text-sm">Did Not Convert</span>
                  <span className="text-[11px] text-slate-500">Customer declined / canceled</span>
                </div>
              </button>
            </div>
          </div>

          {/* If Converted */}
          {isConverted ? (
            <div className="space-y-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 animate-fadeIn">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Final Agreed Business Revenue (Rs.) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={finalValue}
                  onChange={(e) => setFinalValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Quoted Grand Total was Rs. {formatCurrency(quotation.grandTotal)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Customer Acceptance Notes / MOU Details
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Customer approved revised quotation, advance deposit of 50% received."
                  value={clientFeedback}
                  onChange={(e) => setClientFeedback(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>
          ) : (
            /* If Lost */
            <div className="space-y-4 bg-rose-50/50 p-4 rounded-xl border border-rose-200 animate-fadeIn">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Primary Reason for Loss *
                </label>
                <select
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-rose-500 text-xs font-medium"
                >
                  <option value="Client selected alternate venue due to budget constraints">
                    Price / Budget constraint (Competitor or cheaper option)
                  </option>
                  <option value="Event / Program canceled by client management">
                    Event / Program canceled by client management
                  </option>
                  <option value="Dates / Accommodation unavailable for requested schedule">
                    Dates unavailable / Schedule conflict
                  </option>
                  <option value="Location / Logistics unsuitable for participants">
                    Location / Distance unsuitable for participants
                  </option>
                  <option value="No response after multiple follow-ups">
                    No response after multiple follow-ups
                  </option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              {lostReason === 'Other' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Describe reason:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter details..."
                    onChange={(e) => setLostReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Additional Feedback (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Client requested we reach out next quarter for their retreat."
                  value={clientFeedback}
                  onChange={(e) => setClientFeedback(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-rose-500 text-xs"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all ${
                isConverted
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isConverted ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{isSubmitting ? 'Saving...' : (isConverted ? 'Mark as Converted (Won)' : 'Mark as Lost')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


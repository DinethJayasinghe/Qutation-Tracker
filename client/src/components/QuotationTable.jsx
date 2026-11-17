import React from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  GitCompare,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { getPdfDownloadUrl } from '../api';

export default function QuotationTable({ 
  quotations = [], 
  currentRole = 'admin',
  onSelectQuotation, 
  onQuickAuthorize, 
  onOpenConversion,
  onOpenAdjustment,
  onOpenComparison
}) {
  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getStatusBadge = (status, conversion) => {
    switch (status) {
      case 'CONVERTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Business Won
          </span>
        );
      case 'LOST':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            Lost / No Business
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            Pending Admin
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle className="w-3 h-3 text-blue-600" />
            Admin Authorized
          </span>
        );
      case 'SENT_TO_CUSTOMER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <ArrowRight className="w-3 h-3 text-indigo-600" />
            Sent to Customer
          </span>
        );
      case 'ADJUSTMENT_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <RotateCcw className="w-3 h-3 text-purple-600" />
            Adjusted / Negotiating
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
            <XCircle className="w-3 h-3 text-orange-600" />
            Revision Required
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            {status}
          </span>
        );
    }
  };

  if (quotations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Quotations Found</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
          There are no quotations matching your current filter. Create a new quotation manually or upload an Excel spreadsheet to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Quote No. & Source</th>
              <th className="py-3.5 px-4">Client & Organization</th>
              <th className="py-3.5 px-4">Quotation Title</th>
              <th className="py-3.5 px-4">Grand Total</th>
              <th className="py-3.5 px-4">Version & Adjustments</th>
              <th className="py-3.5 px-4">Status & Authorization</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {quotations.map((q) => {
              const qId = q._id || q.id;
              const hasAdjustments = (q.version && q.version > 1) || (q.adjustments && q.adjustments.length > 0);
              const originalTotal = q.originalQuotationSnapshot?.grandTotal;
              const currentTotal = q.grandTotal;
              const diff = originalTotal ? currentTotal - originalTotal : 0;

              return (
                <tr 
                  key={qId} 
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Quotation Number & Source */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        q.source === 'excel_import' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {q.source === 'excel_import' ? (
                          <FileSpreadsheet className="w-4 h-4" title="Imported from Excel" />
                        ) : (
                          <FileText className="w-4 h-4" title="Created Manually" />
                        )}
                      </div>
                      <div>
                        <button 
                          onClick={() => onSelectQuotation(q)}
                          className="font-bold text-blue-700 hover:text-blue-900 hover:underline tracking-tight block text-left"
                        >
                          {q.quotationNumber}
                        </button>
                        <span className="text-[10px] text-slate-400">
                          {q.date ? new Date(q.date).toLocaleDateString('en-GB') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Client & Org */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">
                      {q.client?.organization || q.client?.name || 'Customer'}
                    </div>
                    {q.client?.organization && q.client?.name && (
                      <div className="text-[11px] text-slate-500">
                        Attn: {q.client.name}
                      </div>
                    )}
                  </td>

                  {/* Title */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-medium text-slate-800 truncate" title={q.title}>
                      {q.title || 'Official Quotation'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      By {q.createdBy?.name || 'Staff'} • {q.items?.length || 0} line items
                    </div>
                  </td>

                  {/* Grand Total */}
                  <td className="py-3 px-4 font-mono">
                    <div className="font-bold text-slate-900 text-[13px]">
                      Rs. {formatCurrency(q.grandTotal)}
                    </div>
                    {q.conversion?.isConverted && q.conversion.convertedValue !== q.grandTotal && (
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        Won @ Rs. {formatCurrency(q.conversion.convertedValue)}
                      </div>
                    )}
                  </td>

                  {/* Version & Adjustments */}
                  <td className="py-3 px-4">
                    {hasAdjustments ? (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                            v{q.version || 2} Adjusted
                          </span>
                          <button
                            onClick={() => onOpenComparison(q)}
                            className="p-1 hover:bg-indigo-100 text-indigo-600 rounded transition-colors"
                            title="Compare Original vs Adjusted Quotation"
                          >
                            <GitCompare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {diff !== 0 && (
                          <div className={`text-[10px] font-semibold mt-0.5 ${diff < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {diff < 0 ? `- Rs. ${formatCurrency(Math.abs(diff))}` : `+ Rs. ${formatCurrency(diff)}`} vs Orig
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 font-medium text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        v1.0 (Original)
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    {getStatusBadge(q.status, q.conversion)}
                    {q.approval?.isApproved && (
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span>Auth by {q.approval.approvedBy?.split(' ')[0] || 'Admin'}</span>
                      </div>
                    )}
                  </td>

                  {/* Action buttons */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Details */}
                      <button
                        onClick={() => onSelectQuotation(q)}
                        className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                        title="View Full Quotation & History"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Download PDF */}
                      <a
                        href={getPdfDownloadUrl(qId)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        title="Download Subodhi Branded PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      {/* Quick Admin Authorize if Pending */}
                      {currentRole === 'admin' && q.status === 'PENDING_APPROVAL' && (
                        <button
                          onClick={() => onQuickAuthorize(q)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-sm flex items-center gap-1 transition-all"
                          title="Authorize Quotation Now"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Authorize</span>
                        </button>
                      )}

                      {/* Adjust Button */}
                      {(q.status === 'APPROVED' || q.status === 'SENT_TO_CUSTOMER' || q.status === 'ADJUSTMENT_REQUESTED') && (
                        <button
                          onClick={() => onOpenAdjustment(q)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Record Customer Adjustment / Discount"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}

                      {/* Convert to Business Button */}
                      {q.status !== 'CONVERTED' && q.status !== 'LOST' && q.approval?.isApproved && (
                        <button
                          onClick={() => onOpenConversion(q)}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                          title="Mark Business Conversion (Won / Lost)"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                          <span className="hidden sm:inline">Convert</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


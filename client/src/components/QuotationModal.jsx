import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  FileSpreadsheet, 
  FileText, 
  RotateCcw, 
  Clock, 
  Phone, 
  MapPin, 
  Mail, 
  TrendingUp,
  GitCompare,
  Building2,
  Calendar
} from 'lucide-react';
import { getPdfDownloadUrl } from '../api';

export default function QuotationModal({ 
  quotation, 
  currentRole, 
  onClose, 
  onAuthorize, 
  onReject, 
  onSendToCustomer, 
  onOpenAdjustment, 
  onOpenConversion,
  onOpenComparison 
}) {
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!quotation) return null;

  const qId = quotation._id || quotation.id;
  const isApproved = quotation.approval?.isApproved;
  const isPending = quotation.status === 'PENDING_APPROVAL';
  const isConverted = quotation.status === 'CONVERTED' || quotation.conversion?.isConverted;
  const isLost = quotation.status === 'LOST';
  const hasAdjustments = (quotation.version > 1) || (quotation.adjustments && quotation.adjustments.length > 0);

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleAuthorize = async () => {
    setIsSubmitting(true);
    try {
      await onAuthorize(quotation, adminNotes || 'Officially authorized for client delivery.');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please specify the revision or rejection reason.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onReject(quotation, rejectionReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight">
                  {quotation.quotationNumber}
                </span>
                {quotation.version > 1 && (
                  <span className="bg-indigo-900 text-indigo-200 text-xs px-2 py-0.5 rounded font-semibold border border-indigo-700">
                    Revision v{quotation.version} (Adjusted)
                  </span>
                )}
                {quotation.source === 'excel_import' && (
                  <span className="bg-emerald-950 text-emerald-300 text-xs px-2 py-0.5 rounded font-semibold border border-emerald-800 flex items-center gap-1">
                    <FileSpreadsheet className="w-3 h-3" />
                    Excel Import
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 truncate max-w-md">
                {quotation.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Print Quotation"
            >
              <Printer className="w-4 h-4" />
            </button>
            <a
              href={getPdfDownloadUrl(qId)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              title="Download High-Res PDF with Logo & Contact Details"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Progress / Lifecycle Stepper */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              Quotation Lifecycle Stage
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
              {/* Step 1: Created */}
              <div className="p-2.5 rounded-lg border bg-white border-blue-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">1. Drafted</div>
                  <div className="text-[10px] text-slate-500">By {quotation.createdBy?.name || 'Staff'}</div>
                </div>
              </div>

              {/* Step 2: Admin Authorization */}
              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                isApproved 
                  ? 'bg-emerald-50 border-emerald-300' 
                  : (quotation.status === 'REJECTED' ? 'bg-orange-50 border-orange-300' : 'bg-amber-50 border-amber-300')
              }`}>
                {isApproved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                )}
                <div>
                  <div className="font-bold text-slate-800">2. Admin Auth</div>
                  <div className="text-[10px] text-slate-600">
                    {isApproved ? 'Authorized' : (quotation.status === 'REJECTED' ? 'Revision Needed' : 'Pending Review')}
                  </div>
                </div>
              </div>

              {/* Step 3: Sent to Customer */}
              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                quotation.status === 'SENT_TO_CUSTOMER' || hasAdjustments || isConverted || isLost
                  ? 'bg-blue-50 border-blue-300' 
                  : 'bg-white border-slate-200 opacity-60'
              }`}>
                <ArrowRight className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">3. Customer</div>
                  <div className="text-[10px] text-slate-500">
                    {quotation.status === 'SENT_TO_CUSTOMER' ? 'Delivered' : (isApproved ? 'Ready to Send' : 'Pending Auth')}
                  </div>
                </div>
              </div>

              {/* Step 4: Adjustments */}
              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                hasAdjustments 
                  ? 'bg-indigo-50 border-indigo-300' 
                  : 'bg-white border-slate-200 opacity-60'
              }`}>
                <RotateCcw className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">4. Adjustments</div>
                  <div className="text-[10px] text-slate-500">
                    {hasAdjustments ? `${quotation.adjustments?.length || 1} Revisions` : 'Original Terms'}
                  </div>
                </div>
              </div>

              {/* Step 5: Business Conversion Outcome */}
              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                isConverted 
                  ? 'bg-emerald-100 border-emerald-400' 
                  : (isLost ? 'bg-rose-100 border-rose-400' : 'bg-white border-slate-200 opacity-60')
              }`}>
                {isConverted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                ) : isLost ? (
                  <XCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
                <div>
                  <div className="font-bold text-slate-800">
                    {isConverted ? '5. Won Deal' : (isLost ? '5. Lost Deal' : '5. Conversion')}
                  </div>
                  <div className="text-[10px] text-slate-600 font-semibold">
                    {isConverted ? 'Business Closed!' : (isLost ? 'Did Not Convert' : 'Awaiting Decision')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subodhi Formal Quotation Header Card */}
          <div className="border border-blue-200 rounded-xl p-5 bg-gradient-to-br from-white via-blue-50/20 to-slate-50 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-start gap-4">
                <img 
                  src="/assets/logo.png" 
                  alt="Subodhi Logo" 
                  className="w-16 h-16 object-contain flex-shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/logo.jpg';
                  }}
                />
                <div>
                  <h2 className="text-lg font-bold text-blue-900 tracking-tight">
                    SUBODHI INSTITUTE OF INTEGRAL EDUCATION
                  </h2>
                  <p className="text-xs font-semibold text-red-600 mt-0.5">
                    Center for Human Development, Spiritual Formation & Social Transformation
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Wewala, Piliyandala, Sri Lanka • Phone: 011-2614317 / 011-2613705
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Director: Rev. Fr: Lawrence Ramanayake (+94 77 789 9116) • Coordinator: Rev. Fr. Meril Gunawardena (+94 75 3 668 056)
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-xs uppercase tracking-wider mb-1">
                  OFFICIAL QUOTATION
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {quotation.quotationNumber}
                </div>
                <div className="text-xs text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>Date: {quotation.date ? new Date(quotation.date).toLocaleDateString('en-GB') : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Client & Meta Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Client / Customer Details
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {quotation.client?.organization || quotation.client?.name}
                </div>
                {quotation.client?.organization && quotation.client?.name && (
                  <div className="text-slate-600 mt-0.5 font-medium">
                    Attn: {quotation.client.name}
                  </div>
                )}
                <div className="text-slate-500 mt-1 space-y-0.5">
                  {quotation.client?.phone && <p>📞 {quotation.client.phone}</p>}
                  {quotation.client?.email && <p>✉️ {quotation.client.email}</p>}
                  {quotation.client?.address && <p>📍 {quotation.client.address}</p>}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Quotation Metadata
                </span>
                <div className="space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Prepared By:</span>
                    <span className="font-semibold text-slate-800">{quotation.createdBy?.name || 'Staff'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Validity:</span>
                    <span className="font-semibold text-slate-800">
                      {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('en-GB') : '30 Days'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Currency:</span>
                    <span className="font-semibold text-slate-800">{quotation.currency || 'LKR'} (Sri Lankan Rupee)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Version:</span>
                    <span className="font-semibold text-indigo-700">
                      v{quotation.version || 1} {quotation.version > 1 ? '(Revised with customer)' : '(Original)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Quotation Line Items & Service Details
              </h4>
              <span className="text-xs text-slate-500">
                {quotation.items?.length || 0} Items
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-blue-900 text-white font-bold text-[11px]">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 w-16 text-center">Unit</th>
                    <th className="py-2.5 px-3 w-16 text-right">Qty</th>
                    <th className="py-2.5 px-3 w-28 text-right">Unit Price (Rs.)</th>
                    <th className="py-2.5 px-3 w-16 text-right">Disc %</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(quotation.items || []).map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{item.description}</td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{item.unit || 'Nos'}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-700">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-right text-rose-600 font-semibold">{item.discountPercent || 0}%</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary Footer */}
              <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="text-xs text-slate-600 max-w-sm">
                  <span className="font-bold text-slate-800 block mb-1">Notes & Payment Conditions:</span>
                  <p className="whitespace-pre-line text-[11px] text-slate-500">
                    {quotation.termsAndConditions || '1. Valid for 30 days.\n2. 50% advance confirmation.\n3. Balance payable on completion.'}
                  </p>
                </div>

                <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">Rs. {formatCurrency(quotation.subtotal)}</span>
                  </div>
                  {Number(quotation.totalDiscount) > 0 && (
                    <div className="flex justify-between text-rose-600 font-medium">
                      <span>Discount:</span>
                      <span className="font-mono">- Rs. {formatCurrency(quotation.totalDiscount)}</span>
                    </div>
                  )}
                  {Number(quotation.taxAmount) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Taxes & Charges:</span>
                      <span className="font-mono">Rs. {formatCurrency(quotation.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-blue-900 border-t border-slate-300 pt-2">
                    <span>Grand Total:</span>
                    <span className="font-mono">Rs. {formatCurrency(quotation.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Authorization Sign-off Card */}
          <div className={`p-4 rounded-xl border ${
            isApproved ? 'bg-emerald-50/70 border-emerald-300' : 'bg-amber-50/70 border-amber-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-5 h-5 ${isApproved ? 'text-emerald-600' : 'text-amber-600'}`} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Admin Authorization Sign-Off
                </h4>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isApproved ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-900'
              }`}>
                {isApproved ? 'Officially Authorized' : 'Authorization Pending'}
              </span>
            </div>

            {isApproved ? (
              <div className="text-xs text-slate-700 space-y-1">
                <p>
                  <span className="font-semibold text-slate-800">Authorized by:</span> {quotation.approval?.approvedBy || 'Director / Admin'}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Approval Date:</span> {quotation.approval?.approvedAt ? new Date(quotation.approval.approvedAt).toLocaleString('en-GB') : 'Verified'}
                </p>
                {quotation.approval?.adminNotes && (
                  <p className="bg-white/80 p-2 rounded border border-emerald-200 text-emerald-900 italic mt-1">
                    "{quotation.approval.adminNotes}"
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-600 mb-3">
                  This quotation has not been authorized yet. According to Subodhi operational policy, the quotation must be authorized by the Admin before being sent to the customer.
                </p>

                {currentRole === 'admin' ? (
                  <div className="space-y-3 pt-2 border-t border-amber-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Admin Approval Notes (Optional):
                      </label>
                      <input
                        type="text"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="e.g. Authorized with standard institutional rate. Approved."
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleAuthorize}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Authorize Quotation Now</span>
                      </button>

                      <button
                        onClick={() => setShowRejectForm(!showRejectForm)}
                        className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-700 font-semibold text-xs rounded-lg border border-rose-300 transition-colors"
                      >
                        Request Changes / Reject
                      </button>
                    </div>

                    {showRejectForm && (
                      <div className="p-3 bg-white rounded-lg border border-rose-200 space-y-2 animate-fadeIn">
                        <label className="block text-[11px] font-bold text-rose-800">
                          Specify reason for revision / rejection:
                        </label>
                        <textarea
                          rows={2}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="e.g. Please adjust room pricing to match standard peak season rate."
                          className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-2 focus:ring-rose-500"
                        />
                        <button
                          onClick={handleReject}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded"
                        >
                          Confirm Rejection / Send Back to Employee
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-amber-800 font-medium bg-amber-100/60 p-2.5 rounded-lg border border-amber-200">
                    ℹ️ You are in <strong>Employee Mode</strong>. Please notify the Admin to authorize this quotation, or switch to <strong>Admin Mode</strong> in the top navigation to authorize it yourself for testing.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Adjustment & Customer Negotiation History */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Customer Adjustments & Revision Tracking
                </h4>
              </div>

              <div className="flex items-center gap-2">
                {hasAdjustments && (
                  <button
                    onClick={() => onOpenComparison(quotation)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>View Original vs Adjusted Diff</span>
                  </button>
                )}

                <button
                  onClick={() => onOpenAdjustment(quotation)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors border border-slate-300"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Record New Adjustment</span>
                </button>
              </div>
            </div>

            {hasAdjustments ? (
              <div className="space-y-2">
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-indigo-900">Original Total Quoted: </span>
                    <span className="font-mono text-slate-700">Rs. {formatCurrency(quotation.originalQuotationSnapshot?.grandTotal)}</span>
                  </div>
                  <div>
                    <span className="font-bold text-indigo-900">Current Adjusted Total: </span>
                    <span className="font-mono font-bold text-blue-900">Rs. {formatCurrency(quotation.grandTotal)}</span>
                  </div>
                  <div>
                    <span className="font-bold text-indigo-900">Variance: </span>
                    <span className={`font-mono font-bold ${
                      (quotation.grandTotal - (quotation.originalQuotationSnapshot?.grandTotal || quotation.grandTotal)) < 0 
                        ? 'text-rose-600' 
                        : 'text-emerald-600'
                    }`}>
                      {(quotation.grandTotal - (quotation.originalQuotationSnapshot?.grandTotal || quotation.grandTotal)) < 0 ? '-' : '+'}
                      Rs. {formatCurrency(Math.abs(quotation.grandTotal - (quotation.originalQuotationSnapshot?.grandTotal || quotation.grandTotal)))}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden text-xs">
                  {(quotation.adjustments || []).map((adj, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <span>Revision #{adj.version}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {adj.adjustedAt ? new Date(adj.adjustedAt).toLocaleString('en-GB') : 'Adjusted'}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          <strong>Reason:</strong> {adj.reason}
                        </p>
                        <p className="text-slate-500 text-[10px] italic">
                          {adj.changesSummary}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 font-mono text-[11px]">
                        <span className="font-bold text-slate-800">Rs. {formatCurrency(adj.newGrandTotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No adjustments recorded yet. This quotation is currently in its original state (v1.0). If the customer requests rate negotiation, quantity changes, or package modifications, click "Record New Adjustment".
              </p>
            )}
          </div>

          {/* Business Conversion Outcome Card (Won or Lost) */}
          <div className={`p-4 rounded-xl border ${
            isConverted 
              ? 'bg-emerald-50 border-emerald-300' 
              : isLost 
                ? 'bg-rose-50 border-rose-300' 
                : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-5 h-5 ${
                  isConverted ? 'text-emerald-600' : isLost ? 'text-rose-600' : 'text-blue-600'
                }`} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Business Conversion Outcome
                </h4>
              </div>

              {isConverted ? (
                <span className="text-xs font-bold px-3 py-1 bg-emerald-200 text-emerald-900 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  CONVERTED INTO BUSINESS (WON)
                </span>
              ) : isLost ? (
                <span className="text-xs font-bold px-3 py-1 bg-rose-200 text-rose-900 rounded-full flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  DID NOT CONVERT (LOST)
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-200 text-slate-700 rounded-full">
                  Deal In Progress
                </span>
              )}
            </div>

            {isConverted ? (
              <div className="text-xs text-slate-700 space-y-1">
                <p>
                  <span className="font-bold text-slate-900">Final Converted Business Value:</span>{' '}
                  <span className="font-mono text-emerald-800 font-bold text-sm">
                    Rs. {formatCurrency(quotation.conversion?.convertedValue || quotation.grandTotal)}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Closing Date:</span>{' '}
                  {quotation.conversion?.convertedAt ? new Date(quotation.conversion.convertedAt).toLocaleDateString('en-GB') : 'Closed'}
                </p>
                {quotation.conversion?.clientFeedback && (
                  <p className="bg-white/80 p-2 rounded border border-emerald-200 text-emerald-900 italic mt-1">
                    "{quotation.conversion.clientFeedback}"
                  </p>
                )}
              </div>
            ) : isLost ? (
              <div className="text-xs text-slate-700 space-y-1">
                <p>
                  <span className="font-bold text-rose-900">Reason for Loss:</span>{' '}
                  {quotation.conversion?.lostReason || 'Client did not proceed'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Recorded on: {quotation.conversion?.lostAt ? new Date(quotation.conversion.lostAt).toLocaleDateString('en-GB') : 'Recorded'}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs text-slate-600">
                  Has the customer accepted this quotation and confirmed the event/program?
                </p>
                <button
                  onClick={() => onOpenConversion(quotation)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Update Conversion Outcome</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isApproved && quotation.status === 'APPROVED' && (
              <button
                onClick={() => onSendToCustomer(quotation)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Mark as Sent to Customer</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Calendar, 
  FileText, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin 
} from 'lucide-react';

export default function NewQuotationModal({ currentUser, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [employeeName, setEmployeeName] = useState(currentUser?.name || '');
  const [clientName, setClientName] = useState('');
  const [clientOrg, setClientOrg] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(
    '1. Quotation valid for 30 days from date of issue.\n2. 50% advance confirmation payment required.\n3. Cheques in favor of "Subodhi Institute of Integral Education".'
  );

  const [items, setItems] = useState([
    {
      itemCode: 'ITM-01',
      description: '',
      unit: 'Nos',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      taxPercent: 0
    }
  ]);

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

  // Calculations
  const calculatedItems = items.map((it, idx) => {
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

  const subtotal = calculatedItems.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unitPrice)), 0);
  const totalDiscount = calculatedItems.reduce((sum, it) => {
    const base = Number(it.quantity) * Number(it.unitPrice);
    return sum + ((base * (Number(it.discountPercent) || 0)) / 100);
  }, 0);
  const taxAmount = calculatedItems.reduce((sum, it) => {
    const base = Number(it.quantity) * Number(it.unitPrice);
    const discVal = (base * (Number(it.discountPercent) || 0)) / 100;
    return sum + (((base - discVal) * (Number(it.taxPercent) || 0)) / 100);
  }, 0);
  const grandTotal = Math.round((subtotal - totalDiscount + taxAmount) * 100) / 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a quotation title or subject.');
      return;
    }
    if (!clientName.trim() && !clientOrg.trim()) {
      alert('Please provide the client name or organization.');
      return;
    }

    setIsSubmitting(true);
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + Number(validDays || 30));

      const payload = {
        title,
        createdBy: {
          name: employeeName,
          role: 'employee',
          email: `${employeeName.toLowerCase().replace(/\s+/g, '.')}@subodhi.org`
        },
        client: {
          name: clientName || clientOrg,
          organization: clientOrg,
          phone: clientPhone,
          email: clientEmail,
          address: clientAddress
        },
        validUntil,
        items: calculatedItems,
        notes,
        termsAndConditions: terms,
        status: 'PENDING_APPROVAL' // Requires Admin Authorization!
      };

      await onSubmit(payload);
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
        <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between border-b border-blue-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Create New Quotation</h3>
              <p className="text-xs text-blue-200">Will be routed to Admin for Authorization before client transmission</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-blue-200 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Section 1: Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Quotation Title / Subject *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Annual Staff Training & Spiritual Formation Program"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Prepared By (Employee Name)
              </label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>

          {/* Section 2: Client Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Customer / Organization Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Client Contact Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Rohan Wickramasinghe"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Organization / Company</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Youth Development Trust"
                  value={clientOrg}
                  onChange={(e) => setClientOrg(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +94 77 123 4567"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. rohan@apexdev.org"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Address</label>
                <input
                  type="text"
                  placeholder="e.g. No. 45, Galle Road, Colombo 03"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Dynamic Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Quotation Line Items
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
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
                          placeholder="Item Description"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
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
                          title="Remove Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Preview Bar */}
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">Rs. {formatCurrency(subtotal)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-rose-600 font-medium">
                      <span>Total Discount:</span>
                      <span className="font-mono">- Rs. {formatCurrency(totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-blue-900 border-t border-slate-300 pt-2">
                    <span>Grand Total:</span>
                    <span className="font-mono">Rs. {formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Terms and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Special Notes / Remarks</label>
              <textarea
                rows={3}
                placeholder="e.g. Free Wi-Fi and audio equipment included."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Terms & Conditions</label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              * Quotation will automatically be saved and tagged as <strong>Pending Admin Approval</strong>.
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
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save & Submit for Admin Authorization'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


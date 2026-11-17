import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getSampleExcelUrl, uploadExcelQuotation } from '../api';

export default function ExcelUploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedPreview, setParsedPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processSelectedFile(selected);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && (dropped.name.endsWith('.xlsx') || dropped.name.endsWith('.xls'))) {
      processSelectedFile(dropped);
    } else {
      setError('Please upload a valid Excel spreadsheet (.xlsx or .xls)');
    }
  };

  const processSelectedFile = (selectedFile) => {
    setFile(selectedFile);
    setError(null);

    // Read and parse preview locally
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Extract key info for quick preview
        let client = 'Customer';
        let title = selectedFile.name.replace(/\.[^/.]+$/, "");
        let detectedItems = [];

        for (let i = 0; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          if (!row || row.length === 0) continue;
          const col0 = String(row[0] || '').toLowerCase();
          const col1 = String(row[1] || '');

          if (col0.includes('quotation title')) title = col1 || title;
          if (col0.includes('client') || col0.includes('organization')) client = col1 || client;

          // Simple item row detection
          if (row.length >= 4 && !isNaN(Number(row[2])) && !isNaN(Number(row[3])) && typeof row[1] === 'string' && row[1].length > 2) {
            const qty = Number(row[2]) || 1;
            const price = Number(row[3]) || 0;
            detectedItems.push({
              description: row[1],
              qty,
              price,
              total: qty * price
            });
          }
        }

        const previewTotal = detectedItems.reduce((sum, it) => sum + it.total, 0);

        setParsedPreview({
          fileName: selectedFile.name,
          title,
          client,
          itemCount: detectedItems.length > 0 ? detectedItems.length : 'Auto-detected on server',
          estimatedTotal: previewTotal
        });
      } catch (err) {
        console.warn('Preview parse notice:', err.message);
        setParsedPreview({
          fileName: selectedFile.name,
          title: selectedFile.name,
          client: 'Client in Excel',
          itemCount: 'Ready for processing'
        });
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an Excel file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('excelFile', file);

      const result = await uploadExcelQuotation(formData);
      if (onSuccess) {
        onSuccess(result.data);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload and convert Excel file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between border-b border-emerald-700">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Upload Excel Quotation</h3>
              <p className="text-xs text-emerald-200">
                Converts Excel sheet directly into an official Subodhi PDF with logo and contact information
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-emerald-200 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Explanation Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-slate-700 space-y-1">
              <h4 className="font-bold text-blue-900 text-xs">Automatic Conversion & Admin Routing</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                When you upload an Excel quotation, the system parses the customer information, line items, and totals. It generates a branded Subodhi PDF with high-resolution logo and contact details, and queues it for Admin Authorization before it can be sent to the customer.
              </p>
              <div className="pt-1">
                <a
                  href={getSampleExcelUrl()}
                  download
                  className="inline-flex items-center gap-1.5 font-bold text-blue-700 hover:text-blue-900 underline text-[11px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample Excel Template (.xlsx)</span>
                </a>
              </div>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              file 
                ? 'border-emerald-500 bg-emerald-50/40' 
                : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              className="hidden"
            />

            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>

            {file ? (
              <div>
                <p className="font-bold text-slate-800 text-sm">{file.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB • Click or drag another file to replace
                </p>
                <span className="inline-block mt-2 px-2.5 py-0.5 bg-emerald-200 text-emerald-900 font-bold rounded-full text-[10px]">
                  File Selected & Ready to Process
                </span>
              </div>
            ) : (
              <div>
                <p className="font-bold text-slate-700 text-sm">
                  Click to browse or drag and drop your Excel file here
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports Microsoft Excel (.xlsx, .xls) files
                </p>
              </div>
            )}
          </div>

          {/* Parsed Preview Card */}
          {parsedPreview && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Detected Quotation Summary
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Title:</span>
                  <span className="font-semibold">{parsedPreview.title}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Customer:</span>
                  <span className="font-semibold">{parsedPreview.client}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Detected Items:</span>
                  <span className="font-semibold">{parsedPreview.itemCount}</span>
                </div>
                {parsedPreview.estimatedTotal > 0 && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Estimated Value:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      Rs. {parsedPreview.estimatedTotal.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 text-[11px]">
              Submits for Admin authorization upon conversion.
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
                type="button"
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'Converting to PDF...' : 'Convert to PDF & Submit'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


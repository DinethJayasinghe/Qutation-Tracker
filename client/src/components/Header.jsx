import React from 'react';
import { 
  FileSpreadsheet, 
  PlusCircle, 
  ShieldCheck, 
  User, 
  Download, 
  Building2, 
  PhoneCall,
  LogOut,
  Users
} from 'lucide-react';
import { getSampleExcelUrl } from '../api';

export default function Header({ 
  currentUser, 
  onLogout,
  onOpenEmployeeManagement,
  onNewQuotation, 
  onUploadExcel, 
  pendingCount = 0 
}) {
  const isSuper = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin' || isSuper;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      {/* Top micro contact strip */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white text-xs py-1.5 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-2 border-b border-blue-800/60">
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-wide text-red-400 uppercase text-[11px]">Subodhi Institute of Integral Education</span>
          <span className="hidden md:inline text-blue-300">•</span>
          <span className="hidden md:inline text-slate-200">Wewala, Piliyandala, Sri Lanka</span>
        </div>
        <div className="flex items-center gap-4 text-slate-300 text-[11px]">
          <span className="flex items-center gap-1.5">
            <PhoneCall className="w-3 h-3 text-red-400" />
            <span className="text-white font-medium">011-2614317</span> / <span>011-2613705</span>
          </span>
          <span className="hidden lg:inline text-blue-300">•</span>
          <span className="hidden lg:inline">Director: +94 (77) 789 9116</span>
          <span className="hidden xl:inline text-blue-300">•</span>
          <span className="hidden xl:inline">Coordinator: +94 (75) 3 668 056</span>
        </div>
      </div>

      {/* Main navigation container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex-shrink-0 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <img 
              src="/assets/logo.png" 
              alt="Subodhi Logo" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/assets/logo.jpg';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                SUBODHI <span className="text-blue-600 font-extrabold">QUOTATIONS</span>
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isAdmin 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {isAdmin ? 'Admin Console' : 'Staff Portal'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Institute of Integral Education • Quotation Lifecycle & Conversion Tracker
            </p>
          </div>
        </div>

        {/* Right side user profile and action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* User Profile Badge */}
          {currentUser && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                isAdmin ? 'bg-blue-600' : 'bg-slate-700'
              }`}>
                {currentUser.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="text-left text-xs">
                <div className="font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  {isAdmin ? (
                    <span className="text-blue-700 font-semibold flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      {currentUser.title || 'Admin'}
                    </span>
                  ) : (
                    <span className="text-slate-600 font-medium">
                      {currentUser.title || 'Employee'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Admin-only Employee Management Button */}
          {isAdmin && (
            <button
              onClick={onOpenEmployeeManagement}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold rounded-lg transition-colors shadow-sm"
              title="Manage Employee Accounts, Passwords & Permissions"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Manage Staff</span>
            </button>
          )}

          {/* Action buttons */}
          <a
            href={getSampleExcelUrl()}
            download
            className="inline-flex items-center gap-1.5 px-2.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors shadow-sm"
            title="Download the official Excel quotation template with sample calculations"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Template</span>
          </a>

          <button
            onClick={onUploadExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            title="Upload an Excel quotation and convert to branded PDF"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Upload Excel</span>
          </button>

          <button
            onClick={onNewQuotation}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Quotation</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import EmployeeManagementModal from './components/EmployeeManagementModal';
import MetricsCards from './components/MetricsCards';
import QuotationTable from './components/QuotationTable';
import QuotationModal from './components/QuotationModal';
import NewQuotationModal from './components/NewQuotationModal';
import ExcelUploadModal from './components/ExcelUploadModal';
import AdjustmentModal from './components/AdjustmentModal';
import ConversionModal from './components/ConversionModal';
import ComparisonViewModal from './components/ComparisonViewModal';
import { 
  getStoredUser, 
  logoutUser,
  fetchQuotations, 
  fetchAnalytics, 
  createQuotation, 
  authorizeQuotation, 
  rejectQuotation, 
  sendToCustomer, 
  adjustQuotation, 
  markConversion 
} from './api';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  RotateCcw, 
  TrendingUp, 
  FileSpreadsheet, 
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Users
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [quotations, setQuotations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'approvals', 'adjustments', 'conversions'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  // Modal states
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [adjustingQuotation, setAdjustingQuotation] = useState(null);
  const [convertingQuotation, setConvertingQuotation] = useState(null);
  const [comparingQuotation, setComparingQuotation] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [quotesRes, analyticsRes] = await Promise.all([
        fetchQuotations({ status: statusFilter, search: searchQuery }),
        fetchAnalytics()
      ]);
      setQuotations(quotesRes.data || []);
      setAnalytics(analyticsRes.data || null);
    } catch (err) {
      console.error('Failed to load data:', err);
      if (err.message.includes('Authentication') || err.message.includes('expired')) {
        handleLogout();
      } else {
        showNotification('Failed to load quotations. Please check backend connection.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, statusFilter]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    showNotification(`Welcome back, ${user.name}!`);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setQuotations([]);
    setAnalytics(null);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Action handlers
  const handleCreateQuotation = async (formData) => {
    try {
      const payload = {
        ...formData,
        createdBy: {
          name: currentUser.name,
          role: currentUser.role,
          email: currentUser.email || `${currentUser.username}@subodhi.org`
        }
      };
      const res = await createQuotation(payload);
      showNotification(`Quotation ${res.data.quotationNumber} created and submitted for Admin Authorization!`);
      loadData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleExcelUploadSuccess = (newQuote) => {
    showNotification(`Excel quotation ${newQuote.quotationNumber} uploaded and queued for Admin Authorization!`);
    loadData();
    setSelectedQuotation(newQuote);
  };

  const handleAuthorize = async (quote, notes) => {
    try {
      const qId = quote._id || quote.id;
      const adminSignoffName = `${currentUser.name} (${currentUser.title || 'Director'})`;
      const res = await authorizeQuotation(qId, {
        adminName: adminSignoffName,
        adminNotes: notes
      });
      showNotification(`Quotation ${quote.quotationNumber} officially authorized!`);
      loadData();
      if (selectedQuotation && (selectedQuotation._id === qId || selectedQuotation.id === qId)) {
        setSelectedQuotation(res.data);
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleReject = async (quote, reason) => {
    try {
      const qId = quote._id || quote.id;
      const res = await rejectQuotation(qId, {
        adminName: `${currentUser.name} (${currentUser.title || 'Admin'})`,
        reason
      });
      showNotification(`Quotation marked as revision required / rejected.`, 'info');
      loadData();
      if (selectedQuotation && (selectedQuotation._id === qId || selectedQuotation.id === qId)) {
        setSelectedQuotation(res.data);
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleSendToCustomer = async (quote) => {
    try {
      const qId = quote._id || quote.id;
      const res = await sendToCustomer(qId);
      showNotification(`Quotation ${quote.quotationNumber} marked as sent to customer!`);
      loadData();
      if (selectedQuotation && (selectedQuotation._id === qId || selectedQuotation.id === qId)) {
        setSelectedQuotation(res.data);
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleRecordAdjustment = async (payload) => {
    try {
      const qId = adjustingQuotation._id || adjustingQuotation.id;
      const res = await adjustQuotation(qId, {
        ...payload,
        adjustedBy: currentUser.name
      });
      showNotification(`Adjustment recorded! Created revision v${res.data.version}.`);
      loadData();
      setAdjustingQuotation(null);
      if (selectedQuotation && (selectedQuotation._id === qId || selectedQuotation.id === qId)) {
        setSelectedQuotation(res.data);
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleRecordConversion = async (payload) => {
    try {
      const qId = convertingQuotation._id || convertingQuotation.id;
      const res = await markConversion(qId, payload);
      showNotification(res.message);
      loadData();
      setConvertingQuotation(null);
      if (selectedQuotation && (selectedQuotation._id === qId || selectedQuotation.id === qId)) {
        setSelectedQuotation(res.data);
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // If not logged in, render the login page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Filter list based on active tab
  let displayedQuotations = quotations;
  if (activeTab === 'approvals') {
    displayedQuotations = quotations.filter(q => q.status === 'PENDING_APPROVAL');
  } else if (activeTab === 'adjustments') {
    displayedQuotations = quotations.filter(q => (q.version && q.version > 1) || q.status === 'ADJUSTMENT_REQUESTED');
  } else if (activeTab === 'conversions') {
    displayedQuotations = quotations.filter(q => q.status === 'CONVERTED' || q.status === 'LOST');
  }

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 ${
            notification.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : notification.type === 'info'
                ? 'bg-indigo-600 text-white border-indigo-700'
                : 'bg-emerald-600 text-white border-emerald-700'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenEmployeeManagement={() => setIsEmployeeModalOpen(true)}
        onNewQuotation={() => setIsNewModalOpen(true)}
        onUploadExcel={() => setIsExcelModalOpen(true)}
        pendingCount={analytics?.pendingApprovalCount || 0}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Dashboard - Only visible to Admins / Super Admin */}
        {isAdmin && (
          <MetricsCards
            analytics={analytics}
            onSelectFilter={(status) => {
              setStatusFilter(status);
              setActiveTab('all');
            }}
          />
        )}

        {/* Tab & Filter Bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => { setActiveTab('all'); setStatusFilter('ALL'); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'all' && statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {isAdmin ? `All Quotations (${analytics?.totalQuotes || quotations.length})` : `My Quotations (${quotations.length})`}
            </button>

            {/* Admin Approvals Desk Tab (Highlighted for Admin) */}
            {isAdmin ? (
              <button
                onClick={() => setActiveTab('approvals')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'approvals'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Pending Admin Auth</span>
                {(analytics?.pendingApprovalCount || 0) > 0 && (
                  <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 rounded-full font-extrabold">
                    {analytics.pendingApprovalCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('approvals')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'approvals'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                <span>Awaiting Sign-off ({quotations.filter(q => q.status === 'PENDING_APPROVAL').length})</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('adjustments')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'adjustments'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-800 hover:bg-indigo-50'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAdmin ? `Customer Adjustments (${analytics?.adjustedCount || 0})` : 'Customer Adjustments'}</span>
            </button>

            <button
              onClick={() => setActiveTab('conversions')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'conversions'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{isAdmin ? `Business Conversions (${analytics?.wonCount || 0} Won)` : 'Business Conversions'}</span>
            </button>
          </div>

          {/* Search Box & Refresh */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search quote #, client, org..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </form>

            <button
              onClick={loadData}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quotation Table */}
        <QuotationTable
          quotations={displayedQuotations}
          currentRole={currentUser.role}
          onSelectQuotation={(q) => setSelectedQuotation(q)}
          onQuickAuthorize={(q) => handleAuthorize(q, 'Quick authorized by Admin.')}
          onOpenAdjustment={(q) => setAdjustingQuotation(q)}
          onOpenConversion={(q) => setConvertingQuotation(q)}
          onOpenComparison={(q) => setComparingQuotation(q)}
        />
      </main>

      {/* Footer with Subodhi Contact Information Details */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-slate-300">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img src="/assets/logo.png" alt="Subodhi Logo" className="w-8 h-8 object-contain" />
                <span className="font-bold text-white text-sm">SUBODHI</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Subodhi Institute of Integral Education is dedicated to human development, leadership formation, and spiritual transformation.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">Address & Location</h4>
              <p className="flex items-start gap-1.5 text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>Subodhi Institute of Integral Education, Wewala, Piliyandala, Sri Lanka.</span>
              </p>
              <p className="text-[11px] mt-1.5 text-slate-400">
                General Phone: <span className="text-white font-medium">011-2614317</span>
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">Leadership Contacts</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <span className="font-semibold text-slate-200">Director:</span> Rev. Fr: Lawrence Ramanayake
                  <br />
                  <span className="text-blue-400">Phone: +94 (77) 789 9116</span>
                </li>
                <li>
                  <span className="font-semibold text-slate-200">Program Co-ordinator:</span> Rev. Fr. Meril Gunawardena
                  <br />
                  <span className="text-blue-400">Phone: +94 (75) 3 668 056</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">Facility & Operations</h4>
              <p className="text-[11px]">
                Resource Facilitator Phone: <span className="text-white font-semibold">011-2613705</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Quotation Tracker MERN System with Admin Authorization, Staff RBAC & Business Conversion Analytics.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-6 pt-4 text-center text-[11px] text-slate-500">
            © {new Date().getFullYear()} Subodhi Institute of Integral Education. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedQuotation && (
        <QuotationModal
          quotation={selectedQuotation}
          currentRole={currentUser.role}
          onClose={() => setSelectedQuotation(null)}
          onAuthorize={handleAuthorize}
          onReject={handleReject}
          onSendToCustomer={handleSendToCustomer}
          onOpenAdjustment={(q) => setAdjustingQuotation(q)}
          onOpenConversion={(q) => setConvertingQuotation(q)}
          onOpenComparison={(q) => setComparingQuotation(q)}
        />
      )}

      {isEmployeeModalOpen && isAdmin && (
        <EmployeeManagementModal
          onClose={() => setIsEmployeeModalOpen(false)}
        />
      )}

      {isNewModalOpen && (
        <NewQuotationModal
          currentUser={currentUser}
          onClose={() => setIsNewModalOpen(false)}
          onSubmit={handleCreateQuotation}
        />
      )}

      {isExcelModalOpen && (
        <ExcelUploadModal
          onClose={() => setIsExcelModalOpen(false)}
          onSuccess={handleExcelUploadSuccess}
        />
      )}

      {adjustingQuotation && (
        <AdjustmentModal
          quotation={adjustingQuotation}
          onClose={() => setAdjustingQuotation(null)}
          onSubmit={handleRecordAdjustment}
        />
      )}

      {convertingQuotation && (
        <ConversionModal
          quotation={convertingQuotation}
          onClose={() => setConvertingQuotation(null)}
          onSubmit={handleRecordConversion}
        />
      )}

      {comparingQuotation && (
        <ComparisonViewModal
          quotation={comparingQuotation}
          onClose={() => setComparingQuotation(null)}
        />
      )}
    </div>
  );
}

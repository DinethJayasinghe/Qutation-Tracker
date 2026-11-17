import React from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  XCircle, 
  DollarSign, 
  FileText 
} from 'lucide-react';

export default function MetricsCards({ analytics, onSelectFilter }) {
  if (!analytics) return null;

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-US', {
      maximumFractionDigits: 0
    });
  };

  const cards = [
    {
      title: 'Converted to Business',
      subtitle: `${analytics.wonCount} Deals Won (${analytics.conversionRate}% Win Rate)`,
      value: `Rs. ${formatCurrency(analytics.wonRevenue)}`,
      icon: CheckCircle2,
      color: 'emerald',
      bgLight: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      badge: `${analytics.conversionRate}% Success`,
      filterStatus: 'CONVERTED'
    },
    {
      title: 'Total Quoted Pipeline',
      subtitle: `${analytics.totalQuotes} Active & Archived Quotations`,
      value: `Rs. ${formatCurrency(analytics.totalQuotedValue)}`,
      icon: FileText,
      color: 'blue',
      bgLight: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badge: `${analytics.totalQuotes} Quotes`,
      filterStatus: 'ALL'
    },
    {
      title: 'Pending Admin Approval',
      subtitle: 'Awaiting Director / Coordinator sign-off',
      value: `${analytics.pendingApprovalCount} Quotations`,
      icon: Clock,
      color: 'amber',
      bgLight: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      badge: analytics.pendingApprovalCount > 0 ? 'Action Required' : 'All Clear',
      badgeClass: analytics.pendingApprovalCount > 0 ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-600',
      filterStatus: 'PENDING_APPROVAL'
    },
    {
      title: 'Negotiated Adjustments',
      subtitle: `${analytics.adjustedCount} quotes revised with client`,
      value: analytics.totalAdjustmentVariance < 0 
        ? `- Rs. ${formatCurrency(Math.abs(analytics.totalAdjustmentVariance))}` 
        : `+ Rs. ${formatCurrency(analytics.totalAdjustmentVariance)}`,
      icon: RotateCcw,
      color: 'indigo',
      bgLight: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-700',
      badge: 'Client Revisions',
      filterStatus: 'ADJUSTMENT_REQUESTED'
    },
    {
      title: 'Lost / Did Not Convert',
      subtitle: `${analytics.lostCount} Unsuccessful Inquiries`,
      value: `Rs. ${formatCurrency(analytics.lostValue)}`,
      icon: XCircle,
      color: 'rose',
      bgLight: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      badge: `${analytics.lostCount} Lost`,
      filterStatus: 'LOST'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            onClick={() => onSelectFilter && onSelectFilter(card.filterStatus)}
            className={`p-4 rounded-xl border ${card.border} ${card.bgLight} transition-all hover:shadow-md cursor-pointer relative overflow-hidden group`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${card.text}`}>
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg bg-white shadow-sm border ${card.border}`}>
                <Icon className={`w-4 h-4 ${card.text}`} />
              </div>
            </div>

            <div className="text-xl font-extrabold text-slate-900 tracking-tight group-hover:scale-[1.02] transition-transform">
              {card.value}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
              <span className="text-[11px] text-slate-600 font-medium truncate mr-1">
                {card.subtitle}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${card.badgeClass || `${card.bgLight} ${card.text} border ${card.border}`}`}>
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}


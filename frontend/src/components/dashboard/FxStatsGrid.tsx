import { CreditCard, Users, ShoppingCart, Clock, BarChart2, FileText, DollarSign, CheckCircle, TrendingUp } from 'lucide-react';
import type { DashboardData } from '../../types/dashboard';
import CountUp from '../ui/CountUp';

function GlowCard({ children, gradient }: { children: React.ReactNode; gradient: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm p-5 group hover:shadow-lg transition-all duration-300`}>
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${gradient}`} />
      <div className="relative">{children}</div>
    </div>
  );
}

export default function FxStatsGrid({ data }: { data: DashboardData }) {
  const { pendingPayments, totalUsers, totalOrders, inProcessOrders, monthOrders, monthInvoices, monthOrderValue, pendingMonth } = data;

  return (
    <div className="space-y-4">
      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pending Payments */}
        <div className="relative overflow-hidden rounded-2xl p-5 col-span-1"
          style={{ background: 'linear-gradient(135deg,#ff6b35 0%,#e05555 50%,#c0392b 100%)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-xl" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-lg" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl shadow-inner">
                <CreditCard size={18} className="text-white" />
              </div>
              <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                Needs attention
              </span>
            </div>
            <p className="text-3xl font-black text-white tracking-tight"><CountUp prefix="$" end={pendingPayments.amount} decimals={0} /></p>
            <p className="text-white/80 text-sm font-semibold mt-1">Pending Payments</p>
            <p className="text-white/50 text-xs mt-0.5">Across {pendingPayments.openOrders} open orders</p>
          </div>
        </div>

        {/* Total Users */}
        <GlowCard gradient="bg-gradient-to-br from-sky-50 to-transparent">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-200">
              <Users size={18} className="text-white" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
              <TrendingUp size={9}/> +{totalUsers.changePercent}%
            </span>
          </div>
          <p className="text-3xl font-black text-gray-800 tracking-tight"><CountUp end={totalUsers.count} /></p>
          <p className="text-sm text-gray-400 mt-1">Total Users</p>
        </GlowCard>

        {/* Total Orders */}
        <GlowCard gradient="bg-gradient-to-br from-violet-50 to-transparent">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <ShoppingCart size={18} className="text-white" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
              <TrendingUp size={9}/> +{totalOrders.changePercent}%
            </span>
          </div>
          <p className="text-3xl font-black text-gray-800 tracking-tight"><CountUp end={totalOrders.count} /></p>
          <p className="text-sm text-gray-400 mt-1">Total Orders</p>
        </GlowCard>
      </div>

      {/* Row 2 – Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'In-Process', value: <CountUp end={inProcessOrders} />, badge: 'Active', icon: Clock, from: 'from-cyan-400', to: 'to-teal-500', shadow: 'shadow-cyan-200', change: null },
          { label: 'Month Orders', value: <CountUp end={monthOrders.count} />, badge: null, icon: BarChart2, from: 'from-blue-400', to: 'to-indigo-500', shadow: 'shadow-blue-200', change: `+${monthOrders.changePercent}%` },
          { label: 'Month Invoices', value: <CountUp end={monthInvoices.count} />, badge: null, icon: FileText, from: 'from-purple-400', to: 'to-pink-500', shadow: 'shadow-purple-200', change: `+${monthInvoices.changePercent}%` },
          { label: 'Order Value', value: <CountUp prefix="$" end={monthOrderValue.amount} decimals={0} />, badge: null, icon: DollarSign, from: 'from-emerald-400', to: 'to-teal-500', shadow: 'shadow-emerald-200', change: `+${monthOrderValue.changePercent}%` },
          { label: 'Pending Month', value: <CountUp prefix="$" end={pendingMonth} decimals={2} />, badge: 'Cleared', icon: CheckCircle, from: 'from-green-400', to: 'to-emerald-500', shadow: 'shadow-green-200', change: null },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.from} ${m.to} flex items-center justify-center shadow-lg ${m.shadow}`}>
                <m.icon size={15} className="text-white" />
              </div>
              {m.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.badge === 'Active' ? 'bg-cyan-50 text-cyan-600' : 'bg-green-50 text-green-600'}`}>
                  {m.badge}
                </span>
              )}
              {m.change && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {m.change}
                </span>
              )}
            </div>
            <p className="text-xl font-black text-gray-800">{m.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

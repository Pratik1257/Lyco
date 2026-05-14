import { CreditCard, Users, ShoppingCart, Clock, BarChart2, FileText, DollarSign, CheckCircle, TrendingUp } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

export default function FxStatsGrid({ data, timeframe, currency, isAdmin: isAdminProp }: { data: DashboardData, timeframe: string, currency: string, isAdmin?: boolean }) {

  const location = useLocation();
  const { user } = useAuth();

  // Use prop if provided, else check if current URL is admin, else fallback to user type
  const isAdmin = isAdminProp !== undefined ? isAdminProp : (location.pathname.startsWith('/admin') || user?.userType === 'Admin');
  const { pendingPayments, totalUsers, totalOrders, inProcessOrders, monthOrders, monthInvoices, monthOrderValue, pendingMonth } = data;
  const labelPrefix = timeframe === 'Month' ? 'Month' : timeframe === 'Week' ? 'Week' : 'Year';

  const formatChange = (val: number | string) => {
    const num = Number(val);
    return num > 0 ? `+${num}%` : `${num}%`;
  };

  // Get current date in Eastern Time (America/New_York)
  const now = new Date();
  const etString = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(now); // format: "M/D/YYYY"

  const [m, d, y] = etString.split('/');
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  let firstDay = '';
  let lastDay = '';

  if (timeframe === 'Week') {
    const etDate = new Date(year, month - 1, day);
    const dayOfWeek = etDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    firstDay = formatDate(new Date(year, month - 1, day + diffToMonday));
    lastDay = formatDate(new Date(year, month - 1, day + diffToMonday + 6));
  } else if (timeframe === 'Year') {
    firstDay = formatDate(new Date(year, 0, 1));
    lastDay = formatDate(new Date(year, 11, 31));
  } else {
    firstDay = formatDate(new Date(year, month - 1, 1));
    lastDay = formatDate(new Date(year, month, 0));
  }

  return (
    <div className="space-y-4">
      {/* Row 1 */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-3'} gap-4`}>
        {/* Pending Payments */}
        <Link
          to={isAdmin ? '/admin/orders/history?paymentStatus=Pending' : '/orders/history?paymentStatus=Pending'}
          className="relative overflow-hidden rounded-2xl p-5 col-span-1 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group block"
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
            <p className="text-3xl font-black text-white tracking-tight"><CountUp id="pending-payments" prefix={data.currencySymbol} end={pendingPayments.amount} decimals={Number(pendingPayments.amount) % 1 === 0 ? 0 : 2} /></p>
            <p className="text-white/80 text-sm font-semibold mt-1">Pending Payments</p>
            <p className="text-white/50 text-xs mt-0.5">Across {pendingPayments.openOrders} open orders</p>
          </div>
        </Link>

        {/* Total Users - Admin Only */}
        {isAdmin && (
          <Link to="/admin/customers/summary" className="cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 block">
            <GlowCard gradient="bg-gradient-to-br from-sky-50 to-transparent">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-200">
                  <Users size={18} className="text-white" />
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp size={9} /> {formatChange(totalUsers.changePercent)}
                </span>
              </div>
              <p className="text-3xl font-black text-gray-800 tracking-tight"><CountUp id="total-users" end={totalUsers.count} /></p>
              <p className="text-sm text-gray-400 mt-1">Total Users</p>
            </GlowCard>
          </Link>
        )}

        {/* Total Orders */}
        <Link to={isAdmin ? `/admin/orders/history?currency=${currency}` : `/orders/history?currency=${currency}`} className="cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 block">
          <GlowCard gradient="bg-gradient-to-br from-violet-50 to-transparent">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
                <ShoppingCart size={18} className="text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingUp size={9} /> {formatChange(totalOrders.changePercent)}
              </span>
            </div>
            <p className="text-3xl font-black text-gray-800 tracking-tight"><CountUp id="total-orders" end={totalOrders.count} /></p>
            <p className="text-sm text-gray-400 mt-1">Total Orders</p>
          </GlowCard>
        </Link>

        {/* In-Process - Promoted for Client */}
        {!isAdmin && (
          <Link to={`/orders/history?status=In Process&currency=${currency}`} className="cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 block">
            <GlowCard gradient="bg-gradient-to-br from-cyan-50 to-transparent">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-200">
                  <Clock size={18} className="text-white" />
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-cyan-50 text-cyan-600 uppercase">
                  Active
                </span>
              </div>
              <p className="text-3xl font-black text-gray-800 tracking-tight"><CountUp id="in-process" end={inProcessOrders} /></p>
              <p className="text-sm text-gray-400 mt-1">In-Process Orders</p>
            </GlowCard>
          </Link>
        )}
      </div>

      {/* Row 2 – Metrics (Admin Only) */}
      {isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'In-Process', value: <CountUp id="metric-in-process" end={inProcessOrders} />, badge: 'Active', icon: Clock, from: 'from-cyan-400', to: 'to-teal-500', shadow: 'shadow-cyan-200', change: null, path: `/admin/orders/history?status=In Process&currency=${currency}` },
            { label: `${labelPrefix} Orders`, value: <CountUp id="metric-month-orders" end={monthOrders.count} />, badge: null, icon: BarChart2, from: 'from-blue-400', to: 'to-indigo-500', shadow: 'shadow-blue-200', change: formatChange(monthOrders.changePercent), path: `/admin/orders/history?startDate=${firstDay}&endDate=${lastDay}&timeframe=This ${labelPrefix}&currency=${currency}` },
            { label: `${labelPrefix} Invoices`, value: <CountUp id="metric-month-invoices" end={monthInvoices.count} />, badge: null, icon: FileText, from: 'from-purple-400', to: 'to-pink-500', shadow: 'shadow-purple-200', change: formatChange(monthInvoices.changePercent), path: `/admin/invoices/summary?startDate=${firstDay}&endDate=${lastDay}&timeframe=This ${labelPrefix}&currency=${currency}` },
            { label: `${labelPrefix} Value`, value: <CountUp id="metric-month-value" prefix={data.currencySymbol} end={monthOrderValue.amount} decimals={Number(monthOrderValue.amount) % 1 === 0 ? 0 : 2} />, badge: null, icon: DollarSign, from: 'from-emerald-400', to: 'to-teal-500', shadow: 'shadow-emerald-200', change: formatChange(monthOrderValue.changePercent), path: `/admin/orders/history?startDate=${firstDay}&endDate=${lastDay}&timeframe=This ${labelPrefix}&currency=${currency}` },
            { label: `Pending ${labelPrefix}`, value: <CountUp id="metric-pending-month" prefix={data.currencySymbol} end={pendingMonth} decimals={Number(pendingMonth) % 1 === 0 ? 0 : 2} />, badge: 'Cleared', icon: CheckCircle, from: 'from-green-400', to: 'to-emerald-500', shadow: 'shadow-green-200', change: null, path: `/admin/orders/history?paymentStatus=Pending&startDate=${firstDay}&endDate=${lastDay}&timeframe=This ${labelPrefix}&currency=${currency}` },
          ].map((m) => (
            <Link key={m.label}
              to={m.path}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group block">
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

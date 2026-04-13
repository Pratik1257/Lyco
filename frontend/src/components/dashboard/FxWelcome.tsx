import { TrendingUp, Clock, AlertCircle } from 'lucide-react';
import type { DashboardData } from '../../types/dashboard';
import CountUp from '../ui/CountUp';

export default function FxWelcome({ data }: { data: DashboardData }) {
  const { greeting, todayRevenue, todayOrders } = data;
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1525] via-[#0c2340] to-[#0d2545] p-6 shadow-xl">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl translate-y-1/2" />
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-1">
            Good {timeOfDay}, <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">{greeting.name}</span> 👋
          </h2>
          <p className="text-sm text-slate-400 mb-4">Here's what's happening with your business today.</p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 text-xs font-medium px-3 py-1 rounded-full border border-emerald-500/20">
              <TrendingUp size={11} /> Revenue up {greeting.revenueChangePercent}% vs last month
            </span>
            <span className="inline-flex items-center gap-1.5 bg-cyan-500/15 text-cyan-300 text-xs font-medium px-3 py-1 rounded-full border border-cyan-500/20">
              <Clock size={11} /> {greeting.ordersInProgress} orders in progress
            </span>
            <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-300 text-xs font-medium px-3 py-1 rounded-full border border-amber-500/20">
              <AlertCircle size={11} /> {greeting.quotesAwaiting} quotes awaiting review
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 w-full md:w-auto md:ml-8">
          {[
            { label: "TODAY'S REVENUE", value: <CountUp prefix="$" end={todayRevenue.amount} decimals={0} />, change: `+${todayRevenue.changePercent}% vs yesterday` },
            { label: "TODAY'S ORDERS", value: <CountUp end={todayOrders.count} />, change: `+${todayOrders.changeFromAvg} more than avg` },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-right min-w-[140px] backdrop-blur-sm">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent">{s.value}</p>
              <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center justify-end gap-1">
                <TrendingUp size={10} /> {s.change}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

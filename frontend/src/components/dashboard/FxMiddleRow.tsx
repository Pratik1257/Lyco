import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import type { DashboardData } from '../../types/dashboard';
import CountUp from '../ui/CountUp';

const statusStyle: Record<string, { bg: string; text: string; dot: string }> = {
  New:         { bg: 'bg-blue-50',   text: 'text-blue-600',   dot: 'bg-blue-500' },
  Pending:     { bg: 'bg-amber-50',  text: 'text-amber-600',  dot: 'bg-amber-500' },
  Done:        { bg: 'bg-green-50',  text: 'text-green-600',  dot: 'bg-green-500' },
  'In-Process':{ bg: 'bg-cyan-50',   text: 'text-cyan-600',   dot: 'bg-cyan-500' },
};

const serviceColor: Record<string, string> = {
  'Mock-Up / Virtual': 'text-purple-600', Others: 'text-gray-500',
  'Basic Artwork': 'text-blue-600', 'Complex Artwork': 'text-orange-600',
  Digitizing: 'text-cyan-600',
};

export default function FxMiddleRow({ data }: { data: DashboardData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Service Breakdown */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-0.5">Service Breakdown</h3>
        <p className="text-xs text-gray-400 mb-3">Total orders by service type</p>
        <ResponsiveContainer width="100%" height={170}>
          <PieChart>
            <Pie data={data.serviceBreakdown} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
              dataKey="count" nameKey="name" paddingAngle={3}>
              {data.serviceBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 mt-1">
          {data.serviceBreakdown.map((s) => (
            <div key={s.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-gray-600">{s.name}</span>
              </div>
              <span className="text-xs font-bold text-gray-700"><CountUp end={s.count} /></span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Recent Orders</h3>
            <p className="text-xs text-gray-400 mt-0.5">Latest received orders</p>
          </div>
          <button className="text-xs text-[#0891b2] font-bold flex items-center gap-0.5 hover:gap-1.5 transition-all">
            View All <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="space-y-3">
          {data.recentOrders.map((o) => {
            const s = statusStyle[o.status] ?? statusStyle['New'];
            return (
              <div key={o.id} className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md"
                  style={{ backgroundColor: o.avatarColor }}>{o.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{o.customer}</p>
                  <p className="text-[11px] text-gray-400">{o.service} · {o.orderNumber}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-gray-800"><CountUp prefix="$" end={o.amount} decimals={2} /></p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                    <span className={`w-1 h-1 rounded-full ${s.dot}`} />{o.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Quote Requests */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800">New Quote Requests</h3>
            <p className="text-xs text-gray-400 mt-0.5">Awaiting review</p>
          </div>
          <button className="text-xs text-[#0891b2] font-bold flex items-center gap-0.5 hover:gap-1.5 transition-all">
            View All <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="space-y-3">
          {data.newQuoteRequests.map((q) => (
            <div key={q.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono font-bold text-[#0891b2] bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-100 px-1.5 py-0.5 rounded-md inline-block mb-0.5">
                  {q.id}
                </span>
                <p className="text-xs font-bold text-gray-800 truncate">{q.customer}</p>
                <p className={`text-[11px] font-medium ${serviceColor[q.service] ?? 'text-gray-500'}`}>{q.service}</p>
              </div>
              <span className="text-[11px] text-gray-400 shrink-0 font-medium">{q.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

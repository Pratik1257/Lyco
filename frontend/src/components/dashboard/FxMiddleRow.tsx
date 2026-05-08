import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { DashboardData } from '../../types/dashboard';
import CountUp from '../ui/CountUp';



const serviceColor: Record<string, string> = {
  'Mock-Up / Virtual': 'text-purple-600', Others: 'text-gray-500',
  'Basic Artwork': 'text-blue-600', 'Complex Artwork': 'text-orange-600',
  Digitizing: 'text-cyan-600',
};

function GradientBar({ pct, colors }: { pct: number; colors: string }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full bg-gradient-to-r ${colors}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function FxMiddleRow({ data, isAdmin = true }: { data: DashboardData, isAdmin?: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Service Breakdown */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-0.5">Service Breakdown</h3>
        <p className="text-xs text-gray-400 mb-3">Total orders by service type</p>
        <div className="min-h-[170px] w-full">
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie
                data={data.serviceBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="count"
                nameKey="name"
                paddingAngle={4}
                isAnimationActive={false}
              >
                {data.serviceBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
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

      {/* Order Status */}
      <div 
        onClick={() => navigate(isAdmin ? '/admin/orders/history' : '/orders/history')}
        className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all group"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Order Status</h3>
            <p className="text-xs text-gray-400 mt-0.5">Breakdown by current state</p>
          </div>
          <span className="text-xs font-black text-gray-700 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
            {data.orderStatus.total.toLocaleString()} total
          </span>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Completed', ...data.orderStatus.completed, colors: 'from-emerald-400 to-teal-500', path: isAdmin ? '/admin/orders/history?status=Completed' : '/orders/history?status=Completed' },
            { label: 'New Orders', ...data.orderStatus.newOrders, colors: 'from-blue-400 to-cyan-500', path: isAdmin ? '/admin/orders/history' : '/orders/history' },
            { label: 'Pending', ...data.orderStatus.pending, colors: 'from-amber-400 to-orange-500', path: isAdmin ? '/admin/orders/history' : '/orders/history' },
            { label: 'In-Process', ...data.orderStatus.inProcess, colors: 'from-cyan-400 to-teal-500', path: isAdmin ? '/admin/orders/history?status=In Process' : '/orders/history?status=In Process' },
          ].map((s) => (
            <div key={s.label} onClick={(e) => { e.stopPropagation(); navigate(s.path); }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${s.colors}`} />
                  <span className="text-xs font-medium text-gray-600">{s.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-800">{s.count}</span>
                  <span className="text-[10px] text-gray-400 w-7 text-right">{s.percent}%</span>
                </div>
              </div>
              <GradientBar pct={s.percent} colors={s.colors} />
            </div>
          ))}
        </div>

        <div className="mt-5">
          <p className="text-[10px] text-gray-400 mb-2 font-medium">Overall distribution</p>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
            {[
              { label: 'Completed', ...data.orderStatus.completed, colors: 'from-emerald-400 to-teal-500' },
              { label: 'New Orders', ...data.orderStatus.newOrders, colors: 'from-blue-400 to-cyan-500' },
              { label: 'Pending', ...data.orderStatus.pending, colors: 'from-amber-400 to-orange-500' },
              { label: 'In-Process', ...data.orderStatus.inProcess, colors: 'from-cyan-400 to-teal-500' },
            ].map((s, i) => (
              <div key={i} className={`h-full rounded-full bg-gradient-to-r ${s.colors}`} style={{ width: `${s.percent}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* New Quote Requests */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800">New Quote Requests</h3>
            <p className="text-xs text-gray-400 mt-0.5">Awaiting review</p>
          </div>
          <Link to={isAdmin ? "/admin/quotes" : "/quotes"} className="text-xs text-[#0891b2] font-bold flex items-center gap-0.5 hover:gap-1.5 transition-all">
            View All <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="space-y-3">
          {data.newQuoteRequests.map((q) => (
            <div key={q.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono font-bold text-[#0891b2] bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-100 px-1.5 py-0.5 rounded-md inline-block mb-0.5">
                  {q.id}
                </span>
                <p className="text-xs font-bold text-gray-800 truncate">{isAdmin ? q.customer : q.service}</p>
                {isAdmin && <p className={`text-[11px] font-medium ${serviceColor[q.service] ?? 'text-gray-500'}`}>{q.service}</p>}
              </div>
              <span className="text-[11px] text-gray-400 shrink-0 font-medium">{q.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

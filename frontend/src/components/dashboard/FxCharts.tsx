import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { ArrowUpRight, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardData } from '../../types/dashboard';
import CountUp from '../ui/CountUp';

const statusStyle: Record<string, { bg: string; text: string; dot: string }> = {
  'New':        { bg: 'bg-indigo-50',  text: 'text-indigo-600', dot: 'bg-indigo-500' },
  'Pending':    { bg: 'bg-amber-50',   text: 'text-amber-600',  dot: 'bg-amber-500' },
  'Completed':  { bg: 'bg-emerald-50', text: 'text-emerald-600',dot: 'bg-emerald-500' },
  'Done':       { bg: 'bg-emerald-50', text: 'text-emerald-600',dot: 'bg-emerald-500' },
  'In Process': { bg: 'bg-sky-50',     text: 'text-sky-600',    dot: 'bg-sky-500' },
  'In-Process': { bg: 'bg-sky-50',     text: 'text-sky-600',    dot: 'bg-sky-500' },
  'Invoiced':   { bg: 'bg-purple-50',  text: 'text-purple-600', dot: 'bg-purple-500' },
};

function GradientBar({ pct, colors }: { pct: number; colors: string }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full bg-gradient-to-r ${colors}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function FxCharts({ data, timeframe, isAdmin = true }: { data: DashboardData, timeframe: string, isAdmin?: boolean }) {
  const period = timeframe.toLowerCase() as 'week' | 'month' | 'year';

  return (
    <div className="flex flex-col xl:flex-row gap-4">
      {/* Trend Chart */}
      <div className="flex-[3] bg-white rounded-2xl p-5 border border-gray-100 shadow-sm w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800">{isAdmin ? 'Order & Revenue' : 'Order & Spending History'} {isAdmin ? '& Expenses ' : ''}Trend</h3>
            <p className="text-xs text-gray-400 mt-0.5">Orders received vs {isAdmin ? 'revenue and expenses ' : 'expenditure amount '}({timeframe})</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.orderRevenueTrend[period]} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${data.currencySymbol}${v}`} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="left" type="monotone" dataKey="orders" name="Orders" stroke="#0891b2" strokeWidth={3}
              dot={{ r: 4, fill: '#0891b2', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#0891b2' }} 
              connectNulls isAnimationActive={false} />
            <Line yAxisId="right" type="monotone" dataKey="revenue" name={isAdmin ? `Revenue (${data.currencySymbol})` : `Spend Value (${data.currencySymbol})`} stroke="#f97316" strokeWidth={3}
              dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#f97316' }} 
              connectNulls isAnimationActive={false} />
            {isAdmin && (
              <Line yAxisId="right" type="monotone" dataKey="expenses" name={`Expenses (${data.currencySymbol})`} stroke="#ef4444" strokeWidth={3}
                dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#ef4444' }} 
                connectNulls isAnimationActive={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders / Completed Orders */}
      <div className="flex-[2] bg-white rounded-2xl p-5 border border-gray-100 shadow-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Pending Payment Orders</h3>
            <p className="text-xs text-gray-400 mt-0.5">{isAdmin ? 'Orders awaiting payment from customers' : 'Your orders with pending payments'}</p>
          </div>
          <Link to={isAdmin ? "/admin/orders/history?paymentStatus=Pending" : "/orders/history?paymentStatus=Pending"} className="text-xs text-[#0891b2] font-bold flex items-center gap-0.5 hover:gap-1.5 transition-all">
            View All <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="space-y-3">
          {data.recentOrders.map((o) => {
            const s = statusStyle[o.status] ?? statusStyle['New'];
            return (
              <div key={o.id} className="flex items-center gap-3 group">
                {isAdmin ? (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md"
                    style={{ backgroundColor: o.avatarColor }}>{o.initials}</div>
                ) : (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 shrink-0 shadow-sm">
                    <ShoppingCart size={16} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{isAdmin ? o.customer : o.service}</p>
                  <p className="text-[11px] text-gray-400">{isAdmin ? o.service : o.orderNumber} · {isAdmin ? o.orderNumber : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-gray-800"><CountUp prefix={data.currencySymbol} end={o.amount} decimals={2} /></p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                    <span className={`w-1 h-1 rounded-full ${s.dot}`} />{o.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import type { DashboardData } from '../../types/dashboard';

function GradientBar({ pct, colors }: { pct: number; colors: string }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full bg-gradient-to-r ${colors}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function FxCharts({ data }: { data: DashboardData }) {
  const [period, setPeriod] = useState<'Week' | 'Month' | 'Year'>('Month');
  const { orderStatus } = data;

  const statuses = [
    { label: 'Completed', ...orderStatus.completed, colors: 'from-emerald-400 to-teal-500' },
    { label: 'New Orders', ...orderStatus.newOrders, colors: 'from-blue-400 to-cyan-500' },
    { label: 'Pending', ...orderStatus.pending, colors: 'from-amber-400 to-orange-500' },
    { label: 'In-Process', ...orderStatus.inProcess, colors: 'from-cyan-400 to-teal-500' },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-4">
      {/* Trend Chart */}
      <div className="flex-[3] bg-white rounded-2xl p-5 border border-gray-100 shadow-sm w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Order, Revenue & Expenses Trend</h3>
            <p className="text-xs text-gray-400 mt-0.5">Orders received vs revenue and expenses over time</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100">
            {(['Week', 'Month', 'Year'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  period === p
                    ? 'bg-gradient-to-r from-[#0891b2] to-[#06b6d4] text-white shadow-md shadow-cyan-200'
                    : 'text-gray-400 hover:text-gray-600'
                }`}>{p}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.orderRevenueTrend[period.toLowerCase() as 'week' | 'month' | 'year']} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="left" type="monotone" dataKey="orders" name="Orders" stroke="#0891b2" strokeWidth={2.5}
              dot={{ r: 4, fill: '#0891b2', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#0891b2' }} />
            <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#f97316" strokeWidth={2.5}
              dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#f97316' }} />
            <Line yAxisId="right" type="monotone" dataKey="expenses" name="Expenses ($)" stroke="#ef4444" strokeWidth={2.5}
              dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#ef4444' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Order Status */}
      <div className="flex-[2] bg-white rounded-2xl p-5 border border-gray-100 shadow-sm w-full">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Order Status</h3>
            <p className="text-xs text-gray-400 mt-0.5">Breakdown by current state</p>
          </div>
          <span className="text-xs font-black text-gray-700 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
            {orderStatus.total.toLocaleString()} total
          </span>
        </div>

        <div className="space-y-4">
          {statuses.map((s) => (
            <div key={s.label}>
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
            {statuses.map((s, i) => (
              <div key={i} className={`h-full rounded-full bg-gradient-to-r ${s.colors}`} style={{ width: `${s.percent}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

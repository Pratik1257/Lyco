import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import type { DashboardData } from '../../types/dashboard';

export default function FxBottomRow({ data }: { data: DashboardData }) {

  return (
    <div className="space-y-4">
      {/* Revenue + Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Service */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-0.5">Revenue by Service</h3>
          <p className="text-xs text-gray-400 mb-5">This month performance</p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={data.revenueByService} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${data.currencySymbol}${v}`} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="current" radius={[4, 4, 0, 0]} barSize={32} isAnimationActive={false}>
                {data.revenueByService.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-0.5">Top Customers</h3>
              <p className="text-xs text-gray-400">Highest order volume</p>
            </div>
            {/* Range dropdown kept as is */}
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={data.topCustomers} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="orders" radius={[0, 4, 4, 0]} barSize={12} isAnimationActive={false}>
                {data.topCustomers.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>


    </div>
  );
}

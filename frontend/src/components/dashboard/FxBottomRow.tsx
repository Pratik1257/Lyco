import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Image, Layers, PenTool, MoreHorizontal, Calendar, ChevronDown } from 'lucide-react';
import type { DashboardData } from '../../types/dashboard';
import CountUp from '../ui/CountUp';

const iconMap: Record<string, React.ElementType> = {
  image: Image, layers: Layers, 'pen-tool': PenTool, 'more-horizontal': MoreHorizontal,
};

export default function FxBottomRow({ data }: { data: DashboardData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [range, setRange] = useState('Mar 1 - Mar 31');
  const ranges = ['Today', 'Yesterday', 'Last 7 Days', 'This Month', 'Mar 1 - Mar 31'];

  return (
    <div className="space-y-4">
      {/* Revenue + Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Service */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-0.5">Revenue by Service</h3>
          <p className="text-xs text-gray-400 mb-5">This month performance vs goal</p>
          <div className="space-y-4">
            {data.revenueByService.map((s) => {
              const pct = Math.round((s.current / s.goal) * 100);
              return (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-700">{s.name}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="font-black text-gray-800"><CountUp prefix="$" end={s.current} decimals={0} /></span>
                      / <CountUp prefix="$" end={s.goal} decimals={0} />
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: s.color,
                        boxShadow: `0 0 8px ${s.color}60` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-0.5">Top Customers</h3>
              <p className="text-xs text-gray-400">Highest order volume</p>
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 border border-gray-200 text-xs text-gray-700 font-semibold rounded-lg transition-colors cursor-pointer shadow-sm">
                <Calendar size={13} className="text-gray-400" />
                <span>{range}</span>
                <ChevronDown size={13} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-10 py-1 overflow-hidden">
                  {ranges.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRange(r);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                        range === r ? 'bg-cyan-50 text-cyan-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={data.topCustomers} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }} barCategoryGap="25%">
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={95} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="orders" radius={[0, 6, 6, 0]} maxBarSize={14}>
                {data.topCustomers.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.serviceStats.map((stat) => {
          const Icon = iconMap[stat.icon] ?? Image;
          return (
            <div key={stat.name} className="relative overflow-hidden bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `radial-gradient(circle at top right, ${stat.color}10, transparent 70%)` }} />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
                  style={{ background: `linear-gradient(135deg, ${stat.color}cc, ${stat.color})`,
                    boxShadow: `0 8px 20px ${stat.color}40` }}>
                  <Icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-800"><CountUp end={stat.count} /></p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.name}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

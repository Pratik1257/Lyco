import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import { useAuth } from '../../context/AuthContext';
import type { DashboardData } from '../../types/dashboard';
import FxWelcome from '../../components/dashboard/FxWelcome';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';
import { ShoppingCart, RefreshCw, CreditCard, Image as ImageIcon, Eye, Scissors, Circle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import CountUp from '../../components/ui/CountUp';

const statusStyle: Record<string, { bg: string; text: string; dot: string }> = {
  'New':        { bg: 'bg-indigo-50',  text: 'text-indigo-600', dot: 'bg-indigo-500' },
  'Pending':    { bg: 'bg-amber-50',   text: 'text-amber-600',  dot: 'bg-amber-500' },
  'Completed':  { bg: 'bg-emerald-50', text: 'text-emerald-600',dot: 'bg-emerald-500' },
  'Done':       { bg: 'bg-emerald-50', text: 'text-emerald-600',dot: 'bg-emerald-500' },
  'In Process': { bg: 'bg-sky-50',     text: 'text-sky-600',    dot: 'bg-sky-500' },
  'In-Process': { bg: 'bg-sky-50',     text: 'text-sky-600',    dot: 'bg-sky-500' },
  'Invoiced':   { bg: 'bg-purple-50',  text: 'text-purple-600', dot: 'bg-purple-500' },
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      if (!user?.uniqueNo) return;
      const result = await dashboardApi.getDashboardData('Month', 'USD', Number(user.uniqueNo));
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch customer dashboard data:', err);
      setError('Failed to load your dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [user?.uniqueNo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-red-500">
        {error || 'No data available'}
      </div>
    );
  }

  const stats = [
    { label: 'Total Orders', value: data.totalOrders.count, icon: ShoppingCart, color: 'bg-emerald-500', link: '/orders/history' },
    { label: 'In Process Orders', value: data.inProcessOrders, icon: RefreshCw, color: 'bg-purple-500', link: '/orders/history' },
    { label: 'Pending Payments', value: data.pendingPayments.amount, icon: CreditCard, color: 'bg-amber-500', link: '/payments/make', isCurrency: true },
  ];

  const artworkStats = [
    { label: 'Basic Artwork', value: data.basicArtworkCount, icon: ImageIcon, color: 'bg-blue-500' },
    { label: 'Complex Artwork', value: data.complexArtworkCount, icon: Eye, color: 'bg-emerald-500' },
    { label: 'Digitizing', value: data.digitizingCount, icon: Scissors, color: 'bg-purple-500' },
    { label: 'Others', value: data.otherArtworkCount, icon: Circle, color: 'bg-amber-500' },
  ];

  return (
    <div className="relative space-y-6">
      <FxWelcome data={data} timeframe="Month" />

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center text-white shadow-lg shadow-opacity-20`}>
                <stat.icon size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <h4 className="text-xl font-black text-gray-800 mt-1">
                  {stat.isCurrency && data.currencySymbol}
                  <CountUp end={stat.value} decimals={stat.isCurrency ? 2 : 0} />
                </h4>
              </div>
            </div>
            <Link to={stat.link} className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 text-xs font-bold text-gray-400 group-hover:text-[#0891b2] transition-colors">
              View details <ArrowUpRight size={14} />
            </Link>
          </div>
        ))}
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Recent Orders</h3>
              <p className="text-xs text-gray-400 mt-0.5">Your latest order activity</p>
            </div>
            <Link to="/orders/history" className="text-xs text-[#0891b2] font-bold flex items-center gap-1 hover:gap-2 transition-all">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                  <th className="pb-3 px-2">Order #</th>
                  <th className="pb-3 px-2">Service</th>
                  <th className="pb-3 px-2">Amount</th>
                  <th className="pb-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentOrders.map((o) => {
                  const s = statusStyle[o.status] ?? statusStyle['New'];
                  return (
                    <tr key={o.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-2 text-xs font-bold text-gray-800">{o.orderNumber}</td>
                      <td className="py-3 px-2 text-xs text-gray-600">{o.service}</td>
                      <td className="py-3 px-2 text-xs font-black text-gray-800">{data.currencySymbol}{o.amount.toFixed(2)}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                          <span className={`w-1 h-1 rounded-full ${s.dot}`} />{o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quote Requests */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Quote Requests</h3>
              <p className="text-xs text-gray-400 mt-0.5">Recently requested quotes</p>
            </div>
            <Link to="/quotes" className="text-xs text-[#0891b2] font-bold flex items-center gap-1 hover:gap-2 transition-all">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="space-y-4">
            {data.newQuoteRequests.map((q) => (
              <div key={q.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:border-cyan-100 hover:bg-cyan-50/30 transition-all">
                <div>
                  <span className="text-[10px] font-bold text-[#0891b2] bg-cyan-50 px-2 py-0.5 rounded-md mb-1 inline-block">{q.id}</span>
                  <p className="text-xs font-bold text-gray-800">{q.service}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-medium text-gray-400">{q.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Artwork Category Breakdown (Legacy compatibility) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {artworkStats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className={`w-10 h-10 rounded-full ${stat.color} flex items-center justify-center text-white mb-3 shadow-md`}>
              <stat.icon size={20} />
            </div>
            <h4 className="text-lg font-black text-gray-800"><CountUp end={stat.value} /></h4>
            <p className="text-[11px] font-bold text-gray-400 uppercase mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

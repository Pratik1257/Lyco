import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import type { DashboardData } from '../../types/dashboard';
import { useAuth } from '../../context/AuthContext';
import FxWelcome from '../../components/dashboard/FxWelcome';
import FxGlobalFilters from '../../components/dashboard/FxGlobalFilters';
import FxStatsGrid from '../../components/dashboard/FxStatsGrid';
import FxCharts from '../../components/dashboard/FxCharts';
import FxMiddleRow from '../../components/dashboard/FxMiddleRow';
import FxBottomRow from '../../components/dashboard/FxBottomRow';
import { customersApi } from '../../api/customersApi';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';

export default function ClientDashboard() {
  const { user, updateUser } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('Month');
  const [currency, setCurrency] = useState(() => {
    return (user as any)?.currency || (user as any)?.Currency || 'USD';
  });

  const handleCurrencyChange = (val: string) => {
    setCurrency(val);
    localStorage.setItem('dashboard_currency', val);
  };
  const uniqueNo = (user as any)?.uniqueNo;

  // Sync with latest profile on mount to catch Admin changes
  useEffect(() => {
    if (user?.userId) {
      customersApi.getCustomerById(user.userId).then(latest => {
        const latestCurrency = latest.currency || (latest as any).Currency;
        if (latestCurrency && latestCurrency !== user.currency) {
          updateUser({ currency: latestCurrency });
          setCurrency(latestCurrency);
        }
      }).catch(console.error);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!uniqueNo) return;
    
    try {
      setData(currentData => {
        if (!currentData) setLoading(true);
        return currentData;
      });
      
      const result = await dashboardApi.getDashboardData(timeframe, currency, uniqueNo);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch client dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [timeframe, currency, uniqueNo]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-red-500">
        {error || 'No data available'}
      </div>
    );
  }

  return (
    <div className="relative space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <FxWelcome data={data} timeframe={timeframe} isAdmin={false} />
      <FxGlobalFilters 
        timeframe={timeframe} 
        setTimeframe={setTimeframe} 
        currency={currency} 
        setCurrency={handleCurrencyChange} 
        isAdmin={false}
      />
      <FxStatsGrid data={data} timeframe={timeframe} currency={currency} isAdmin={false} />
      <FxCharts data={data} timeframe={timeframe} isAdmin={false} />
      <FxMiddleRow data={data} isAdmin={false} />
    </div>
  );
}

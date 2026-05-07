import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import type { DashboardData } from '../../types/dashboard';
import FxWelcome from '../../components/dashboard/FxWelcome';
import FxGlobalFilters from '../../components/dashboard/FxGlobalFilters';
import FxStatsGrid from '../../components/dashboard/FxStatsGrid';
import FxCharts from '../../components/dashboard/FxCharts';
import FxMiddleRow from '../../components/dashboard/FxMiddleRow';
import FxBottomRow from '../../components/dashboard/FxBottomRow';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('Month');
  const [currency, setCurrency] = useState('USD');

  const fetchDashboardData = useCallback(async () => {
    try {
      // We only show the full-page skeleton if we have no data yet
      setData(currentData => {
        if (!currentData) setLoading(true);
        return currentData;
      });
      
      const result = await dashboardApi.getDashboardData(timeframe, currency);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [timeframe, currency]);

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
    <div className="relative space-y-4">
      <FxWelcome data={data} timeframe={timeframe} />
      <FxGlobalFilters 
        timeframe={timeframe} 
        setTimeframe={setTimeframe} 
        currency={currency} 
        setCurrency={setCurrency} 
      />
      <FxStatsGrid data={data} timeframe={timeframe} />
      <FxCharts data={data} timeframe={timeframe} />
      <FxMiddleRow data={data} />
      <FxBottomRow data={data} />
    </div>
  );
}

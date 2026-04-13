import { mockDashboard } from '../data/mockDashboard';
import FxWelcome from '../components/dashboard/FxWelcome';
import FxStatsGrid from '../components/dashboard/FxStatsGrid';
import FxCharts from '../components/dashboard/FxCharts';
import FxMiddleRow from '../components/dashboard/FxMiddleRow';
import FxBottomRow from '../components/dashboard/FxBottomRow';

export default function Dashboard() {
  const data = mockDashboard;

  return (
    /*  Pull past Layout's p-6 padding to paint edge-to-edge, then re-apply padding */
    <div className="-m-6 min-h-screen p-6"
      style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f0fdf4 50%, #fafafa 75%, #f5f3ff 100%)',
      }}>

      {/* Subtle geometric decoration */}
      <div className="fixed top-16 right-8 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-16 left-72 w-72 h-72 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative space-y-4">
         

        <FxWelcome data={data} />
        <FxStatsGrid data={data} />
        <FxCharts data={data} />
        <FxMiddleRow data={data} />
        <FxBottomRow data={data} />
      </div>
    </div>
  );
}

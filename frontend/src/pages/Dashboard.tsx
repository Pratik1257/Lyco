import { mockDashboard } from '../data/mockDashboard';
import FxWelcome from '../components/dashboard/FxWelcome';
import FxStatsGrid from '../components/dashboard/FxStatsGrid';
import FxCharts from '../components/dashboard/FxCharts';
import FxMiddleRow from '../components/dashboard/FxMiddleRow';
import FxBottomRow from '../components/dashboard/FxBottomRow';

export default function Dashboard() {
  const data = mockDashboard;

  return (
    <div className="relative space-y-4">
      <FxWelcome data={data} />
      <FxStatsGrid data={data} />
      <FxCharts data={data} />
      <FxMiddleRow data={data} />
      <FxBottomRow data={data} />
    </div>
  );
}

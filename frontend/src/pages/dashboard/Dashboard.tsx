import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import ClientDashboard from './ClientDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return <ClientDashboard />;
}

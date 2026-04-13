export interface DashboardData {
  greeting: {
    name: string;
    revenueChangePercent: number;
    ordersInProgress: number;
    quotesAwaiting: number;
  };
  todayRevenue: { amount: number; changePercent: number };
  todayOrders: { count: number; changeFromAvg: number };
  pendingPayments: { amount: number; openOrders: number };
  totalUsers: { count: number; changePercent: number };
  totalOrders: { count: number; changePercent: number };
  inProcessOrders: number;
  monthOrders: { count: number; changePercent: number };
  monthInvoices: { count: number; changePercent: number };
  monthOrderValue: { amount: number; changePercent: number };
  pendingMonth: number;
  orderRevenueTrend: {
    week: { label: string; orders: number; revenue: number; expenses: number }[];
    month: { label: string; orders: number; revenue: number; expenses: number }[];
    year: { label: string; orders: number; revenue: number; expenses: number }[];
  };
  orderStatus: {
    total: number;
    completed: { count: number; percent: number };
    newOrders: { count: number; percent: number };
    pending: { count: number; percent: number };
    inProcess: { count: number; percent: number };
  };
  serviceBreakdown: { name: string; count: number; color: string }[];
  recentOrders: {
    id: string;
    customer: string;
    initials: string;
    avatarColor: string;
    service: string;
    orderNumber: string;
    amount: number;
    status: 'New' | 'Pending' | 'Done' | 'In-Process';
  }[];
  newQuoteRequests: {
    id: string;
    customer: string;
    service: string;
    date: string;
  }[];
  revenueByService: { name: string; current: number; goal: number; color: string }[];
  topCustomers: { name: string; orders: number; color: string }[];
  serviceStats: { name: string; count: number; icon: string; color: string }[];
}

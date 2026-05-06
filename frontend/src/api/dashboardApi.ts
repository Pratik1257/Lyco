import apiClient from './apiClient';
import type { DashboardData } from '../types/dashboard';

export const dashboardApi = {
  getDashboardData: async (timeframe: string = 'Month', currency: string = 'USD'): Promise<DashboardData> => {
    const response = await apiClient.get<DashboardData>(`/Dashboard?timeframe=${timeframe}&currency=${currency}`);
    return response.data;
  },
};

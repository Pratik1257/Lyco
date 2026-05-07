import apiClient from './apiClient';
import type { DashboardData } from '../types/dashboard';

export const dashboardApi = {
  getDashboardData: async (timeframe: string = 'Month', currency: string = 'USD', uniqueNo?: number): Promise<DashboardData> => {
    let url = `/Dashboard?timeframe=${timeframe}&currency=${currency}`;
    if (uniqueNo) url += `&uniqueNo=${uniqueNo}`;
    const response = await apiClient.get<DashboardData>(url);
    return response.data;
  },
};

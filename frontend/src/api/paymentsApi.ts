import { apiClient } from './client';

export interface PendingOrder {
  orderId: number;
  orderNo: string;
  orderDate: string;
  amount: string;
  currency: string;
  poNo: string;
}

export interface UpdateStatusRequest {
  orderIds: number[];
  status: 'Completed' | 'Bad Debt';
}

export const paymentsApi = {
  getPendingForStatus: async (uniqueNo: number): Promise<PendingOrder[]> => {
    const response = await apiClient.get('/Payments/pending-for-status', {
      params: { uniqueNo },
    });
    return response.data;
  },

  updateStatus: async (request: UpdateStatusRequest): Promise<{ message: string }> => {
    const response = await apiClient.put('/Payments/status', request);
    return response.data;
  },
};

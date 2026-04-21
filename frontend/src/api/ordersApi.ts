import apiClient from './apiClient';

export interface Order {
  orderId: number;
  orderNo: string | null;
  orderDate: string | null;
  workTitle: string | null; // PO No.
  amount: string | null;
  currency: string | null;
  orderStatus: string | null;
  completedDate: string | null;
  email: string | null;
  username: string;
  serviceName: string;
  serviceId: number | null;
}

export interface OrdersResponse {
  items: Order[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const ordersApi = {
  getOrders: async (
    page: number = 1,
    pageSize: number = 10,
    search: string = '',
    status: string = 'all',
    serviceId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<OrdersResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (serviceId) params.append('serviceId', serviceId.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await apiClient.get<OrdersResponse>(`/Orders?${params.toString()}`);
    return res.data;
  },

  createOrder: async (data: any) => {
    const res = await apiClient.post('/Orders', data);
    return res.data;
  },

  getNextOrderNumber: async (uniqueNo: number) => {
    const res = await apiClient.get<{ orderNo: string }>('/Orders/next-number', {
      params: { uniqueNo }
    });
    return res.data.orderNo;
  }
};

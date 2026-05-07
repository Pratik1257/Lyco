import apiClient from './apiClient';

export interface PendingOrder {
  orderId: number;
  orderNo: string;
  orderDate: string;
  amount: string;
  currency: string;
  poNo: string;
}

export interface PaymentOrder {
  orderId: number;
  orderNo: string;
  orderDate: string;
  amount: string;
  currency: string;
  poNo: string;
  serviceName: string;
  username: string;
  fullname: string;
}

export interface SummaryOrder {
  orderId: number;
  orderNo: string;
  orderDate: string;
  amount: string;
  currency: string;
  paymentStatus: string;
  paymentDate: string | null;
  invoiceNo: string | null;
  orderStatus: string;
  completedDate: string | null;
  workTitle: string;
  username: string;
  companyName: string;
  serviceName: string;
}

export interface SummaryResponse {
  items: SummaryOrder[];
  totalCount: number;
}

export interface UpdateStatusRequest {
  orderIds: number[];
  status: 'Completed' | 'Bad Debt' | 'Pending';
}

export interface InitiatePaymentRequest {
  userId: number;
  orderIds: number[];
}

export interface InitiatePaymentResponse {
  paypalUrl: string;
  transactionNumber: string;
}

export interface PaypalConfig {
  id: number;
  email: string;
}

export const paymentsApi = {
  async getPendingForStatus(uniqueNo: number): Promise<PendingOrder[]> {
    const response = await apiClient.get<PendingOrder[]>(`../admin/api/Payments/pending-for-status?uniqueNo=${uniqueNo}`);
    return response.data;
  },

  async getBadDebtOrders(uniqueNo: number): Promise<PendingOrder[]> {
    const response = await apiClient.get<PendingOrder[]>(`../admin/api/Payments/bad-debt?uniqueNo=${uniqueNo}`);
    return response.data;
  },

  async getPendingForPayment(userId?: number | null): Promise<PaymentOrder[]> {
    const url = userId 
      ? `../admin/api/Payments/pending-for-payment?userId=${userId}`
      : `../admin/api/Payments/pending-for-payment`;
    const response = await apiClient.get<PaymentOrder[]>(url);
    return response.data;
  },

  getSummary: async (
    page: number,
    pageSize: number,
    search?: string,
    serviceId?: number,
    paymentStatus?: string,
    startDate?: string,
    endDate?: string,
    uniqueNo?: number
  ): Promise<SummaryResponse> => {
    const response = await apiClient.get<SummaryResponse>('../admin/api/Payments/summary', {
      params: { page, pageSize, search, serviceId, paymentStatus, startDate, endDate, uniqueNo },
    });
    return response.data;
  },

  updateStatus: async (request: UpdateStatusRequest): Promise<{ message: string }> => {
    const response = await apiClient.put('../admin/api/Payments/status', request);
    return response.data;
  },

  initiatePayment: async (request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> => {
    const response = await apiClient.post<InitiatePaymentResponse>('../admin/api/Payments/initiate', request);
    return response.data;
  },

  async getPaypalConfig(): Promise<PaypalConfig[]> {
    const response = await apiClient.get<PaypalConfig[]>('../admin/api/Payments/paypal-config');
    return response.data;
  },

  async updatePaypalConfig(id: number, email: string): Promise<{ message: string }> {
    const response = await apiClient.put(`../admin/api/Payments/paypal-config/${id}`, { email });
    return response.data;
  },
};

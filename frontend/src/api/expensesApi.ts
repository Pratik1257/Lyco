import apiClient from './apiClient';

export interface Expense {
  expenseId: number;
  serviceId: number | null;
  serviceName: string | null;
  title: string | null;
  amount: number | null;
  currency: string | null;
  expenseDate: string | null;
  notes: string | null;
  createdDate: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  filteredTotalAmount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateExpensePayload {
  serviceId: number;
  title: string;
  amount: number;
  currency: string;
  expenseDate: string;
  notes?: string;
}

export interface UpdateExpensePayload {
  serviceId: number;
  title: string;
  amount: number;
  currency: string;
  expenseDate: string;
  notes?: string;
}

export const expensesApi = {
  getExpenses: async (
    page: number,
    pageSize: number,
    search: string = '',
    serviceId?: number,
    startDate?: string,
    endDate?: string
  ) => {
    const params: Record<string, any> = { page, pageSize, search };
    if (serviceId) params.serviceId = serviceId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await apiClient.get<PagedResult<Expense>>('/Expenses', { params });
    return response.data;
  },

  getExpenseById: async (id: number) => {
    const response = await apiClient.get<Expense>(`/Expenses/${id}`);
    return response.data;
  },

  createExpense: async (data: CreateExpensePayload) => {
    const response = await apiClient.post<Expense>('/Expenses', data);
    return response.data;
  },

  updateExpense: async (id: number, data: UpdateExpensePayload) => {
    const response = await apiClient.put<Expense>(`/Expenses/${id}`, data);
    return response.data;
  },

  deleteExpense: async (id: number) => {
    await apiClient.delete(`/Expenses/${id}`);
  },
};

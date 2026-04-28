import apiClient from './apiClient';

export interface Invoice {
  invoiceId: number;
  invoiceNo: string;
  invoiceDate: string;
  amount: string;
  po: string;
  invoiceType: string;       // "Individual" | "Combined"
  username: string;
  companyName: string;
  customerId: string;
  orderNos: string;          // "113-61" or "71 to 75"
  status: string;            // "Paid" | "Unpaid"
  pdfUrl: string;
}

export interface InvoicesResponse {
  items: Invoice[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreatedInvoice {
  invoiceNo: string;
  invoiceId: number;
  pdfUrl: string;
}

export const invoicesApi = {
  getInvoices: async (
    page: number = 1,
    pageSize: number = 10,
    search: string = '',
    status: string = ''
  ): Promise<InvoicesResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);
    const res = await apiClient.get<InvoicesResponse>(`/Invoices?${params.toString()}`);
    return res.data;
  },

  createInvoice: async (data: {
    userId: number;
    orderIds: number[];
    invoiceType: string;
  }): Promise<{ invoices: CreatedInvoice[] }> => {
    const res = await apiClient.post<{ invoices: CreatedInvoice[] }>('/Invoices', data);
    return res.data;
  },

  updateInvoiceStatus: async (invoiceId: number, status: 'Paid' | 'Unpaid'): Promise<void> => {
    await apiClient.put(`/Invoices/${invoiceId}/status`, { status });
  },

  getNextInvoiceNumber: async (): Promise<string> => {
    const res = await apiClient.get<{ invoiceNo: string }>('/Invoices/next-number');
    return res.data.invoiceNo;
  }
};

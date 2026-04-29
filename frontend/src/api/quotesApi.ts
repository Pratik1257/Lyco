import apiClient from './apiClient';

export interface Quote {
  quoteId: number;
  quoteNo: string | null;
  quoteDate: string | null;
  workTitle: string | null; // PO No.
  amount: string | null;
  currency: string | null;
  email: string | null;
  username: string;
  fullname: string;
  serviceName: string;
  serviceId: number | null;
  instructions: string | null;
  size: string | null;
  sizetype: string | null;
  uniqueNo: number | null;
  fileFormat: string | null;
}

export interface QuotesResponse {
  items: Quote[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const quotesApi = {
  getQuotes: async (
    page: number = 1,
    pageSize: number = 10,
    search: string = '',
    serviceId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<QuotesResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    if (serviceId) params.append('serviceId', serviceId.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await apiClient.get<QuotesResponse>(`/Quotes?${params.toString()}`);
    return res.data;
  },

  getQuoteById: async (id: number) => {
    const res = await apiClient.get(`/Quotes/${id}`);
    return res.data;
  },

  getNextQuoteNumber: async (uniqueNo: number) => {
    const res = await apiClient.get<{ quoteNo: string }>('/Quotes/next-number', {
      params: { uniqueNo }
    });
    return res.data.quoteNo;
  },

  createQuote: async (data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'files' && Array.isArray(data[key])) {
        data.files.forEach((file: File) => formData.append('files', file));
      } else if (key === 'filesToDelete' && Array.isArray(data[key])) {
        data[key].forEach((fileId: number) => formData.append('filesToDelete', fileId.toString()));
      } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        // Only append if it's not an empty array (already handled above)
        if (!Array.isArray(data[key])) {
          formData.append(key, data[key]);
        }
      }
    });
    const res = await apiClient.post('/Quotes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  updateQuote: async (id: number, data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'files' && Array.isArray(data[key])) {
        data.files.forEach((file: File) => formData.append('files', file));
      } else if (key === 'filesToDelete' && Array.isArray(data[key])) {
        data[key].forEach((fileId: number) => formData.append('filesToDelete', fileId.toString()));
      } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        if (!Array.isArray(data[key])) {
          formData.append(key, data[key]);
        }
      }
    });
    const res = await apiClient.put(`/Quotes/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  convertToOrder: async (id: number) => {
    const res = await apiClient.post(`/Quotes/${id}/convert`);
    return res.data;
  },

  deleteQuote: async (id: number) => {
    const res = await apiClient.delete(`/Quotes/${id}`);
    return res.data;
  }
};

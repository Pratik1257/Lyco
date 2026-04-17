import apiClient from './apiClient';

export interface Customer {
  userId: number;
  username: string;
  password?: string;
  firstname: string;
  lastname: string;
  companyname: string;
  primaryEmail: string;
  telephone: string;
  city: string;
  state: string;
  websiteUrl: string;
  address1: string;
  address2: string;
  zipcode: string;
  countryId: number | null;
  currency: string;
  accountEmail: string;
  isActive: string;      // untouched DB field
  userType: string;
  createdDate: string;
  hasValidCard: boolean; // computed from card expiry dates — not from DB
}

export interface Country {
  countryId: number;
  countryName: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const customersApi = {
  getCountries: async () => {
    const response = await apiClient.get<Country[]>('/Countries');
    return response.data;
  },

  getCustomers: async (page = 1, pageSize = 10, search = '', status = 'all') => {
    const params = {
      page,
      pageSize,
      search,
      ...(status !== 'all' && { status })
    };
    const response = await apiClient.get<PagedResult<Customer>>('/Users', { params });
    return response.data;
  },

  createCustomer: async (data: Partial<Customer>) => {
    const response = await apiClient.post<Customer>('/Users', data);
    return response.data;
  },

  getCustomerById: async (id: number) => {
    const response = await apiClient.get<Customer>(`/Users/${id}`);
    return response.data;
  },

  updateCustomer: async (id: number, data: Partial<Customer>) => {
    const response = await apiClient.put<Customer>(`/Users/${id}`, data);
    return response.data;
  },

  deleteCustomer: async (id: number) => {
    await apiClient.delete(`/Users/${id}`);
  }
};

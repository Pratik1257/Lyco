import apiClient from './apiClient';

export interface GeneralPrice {
  id: number;
  serviceId: number;
  serviceName: string;
  currency: string;
  price: number;
}

export interface UserwisePrice {
  id: number;
  userId: number;
  username: string;
  serviceId: number;
  serviceName: string;
  currency: string;
  price: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserDto {
  id: number;
  username: string;
}

export interface CurrencyDto {
  id: number;
  code: string;
  name: string;
  symbol: string;
}

export const pricesApi = {
  // --- General Prices ---
  getGeneralPrices: async (page: number, pageSize: number, search: string = '') => {
    const response = await apiClient.get<PagedResult<GeneralPrice>>('/Prices/general', {
      params: { page, pageSize, search }
    });
    return response.data;
  },

  createGeneralPrice: async (serviceId: number, currency: string, price: number) => {
    const response = await apiClient.post<GeneralPrice>('/Prices/general', {
      serviceId,
      currency,
      price
    });
    return response.data;
  },

  updateGeneralPrice: async (id: number, serviceId: number, currency: string, price: number) => {
    const response = await apiClient.put<GeneralPrice>(`/Prices/general/${id}`, {
      serviceId,
      currency,
      price
    });
    return response.data;
  },

  // --- Userwise Prices ---
  getUserwisePrices: async (page: number, pageSize: number, search: string = '') => {
    const response = await apiClient.get<PagedResult<UserwisePrice>>('/Prices/userwise', {
      params: { page, pageSize, search }
    });
    return response.data;
  },

  createUserwisePrice: async (userId: number, serviceId: number, currency: string, price: number) => {
    const response = await apiClient.post<UserwisePrice>('/Prices/userwise', {
      userId,
      serviceId,
      currency,
      price
    });
    return response.data;
  },

  updateUserwisePrice: async (id: number, userId: number, serviceId: number, currency: string, price: number) => {
    const response = await apiClient.put<UserwisePrice>(`/Prices/userwise/${id}`, {
      userId,
      serviceId,
      currency,
      price
    });
    return response.data;
  },

  getCurrencies: async () => {
    const response = await apiClient.get<CurrencyDto[]>('/Currencies');
    return response.data;
  },
};

export const usersApi = {
  getUsers: async () => {
    const response = await apiClient.get<UserDto[]>('/Users');
    return response.data;
  }
};

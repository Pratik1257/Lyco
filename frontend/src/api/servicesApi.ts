import apiClient from './apiClient';

export interface Service {
  id: number; // long from backend
  name: string;
  createdAt: string;
  canDelete?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const servicesApi = {
  /**
   * Fetch services with server-side pagination and search.
   */
  getServices: async (page: number, pageSize: number, search: string = '') => {
    const response = await apiClient.get<PagedResult<Service>>('/Services', {
      params: {
        page,
        pageSize,
        search,
      },
    });
    return response.data;
  },

  /**
   * Create a new service.
   */
  createService: async (name: string) => {
    const response = await apiClient.post<Service>('/Services', { name });
    return response.data;
  },

  /**
   * Update an existing service name.
   */
  updateService: async (id: number, name: string) => {
    const response = await apiClient.put<Service>(`/Services/${id}`, { name });
    return response.data;
  },

  /**
   * Delete a service.
   */
  deleteService: async (id: number) => {
    await apiClient.delete(`/Services/${id}`);
  },
};

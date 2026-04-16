import apiClient from './apiClient';
import { type PagedResult } from './customersApi';

export interface CardDetail {
  cardId: number;
  userId: number | null;
  username: string | null;
  cardType: string | null;
  cardNo: string | null;
  expDate: string | null;
  cvv: string | null;
  asRegistered: string | null;
  firstName: string | null;
  middlename: string | null;
  lastName: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  postcode: string | null;
  countryId: number | null;
  state: string | null;
  currency: string | null;
  comments: string | null;
}

export const cardsApi = {
  getCards: async (page: number, pageSize: number, search: string = '') => {
    const response = await apiClient.get<PagedResult<CardDetail>>('/CardDetails', {
      params: { page, pageSize, search }
    });
    return response.data;
  },

  getCardById: async (id: number) => {
    const response = await apiClient.get<CardDetail>(`/CardDetails/${id}`);
    return response.data;
  },

  createCard: async (data: Partial<CardDetail>) => {
    const response = await apiClient.post<CardDetail>('/CardDetails', data);
    return response.data;
  },

  updateCard: async (id: number, data: Partial<CardDetail>) => {
    const response = await apiClient.put<CardDetail>(`/CardDetails/${id}`, data);
    return response.data;
  },

  deleteCard: async (id: number) => {
    await apiClient.delete(`/CardDetails/${id}`);
  }
};

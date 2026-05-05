import apiClient from './apiClient';

export interface Country {
  countryId: number;
  countryName: string;
}

export const countriesApi = {
  getCountries: async () => {
    const response = await apiClient.get<Country[]>('/countries');
    return response.data;
  }
};

import apiClient from './apiClient';

export interface LoginResponse {
  userId: number;
  username: string;
  fullname: string;
  userType: string;
  token: string;
  uniqueNo?: number;
  email?: string;
  currency?: string;
  companyName?: string;
}

export const authApi = {
  login: async (data: any) => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },
  register: async (data: any) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  forgotPassword: async (username: string) => {
    const response = await apiClient.post<{ email: string }>('/auth/forgot-password', { Username: username });
    return response.data;
  },
  resetPassword: async (data: { Username: string; NewPassword: string }) => {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', data);
    return response.data;
  },
  sendVerification: async (email: string) => {
    const response = await apiClient.post<{ message: string, code: string }>('/auth/send-verification', { Email: email });
    return response.data;
  },
  checkUsername: async (username: string) => {
    const response = await apiClient.get<{ available: boolean }>(`/auth/check-username?username=${encodeURIComponent(username)}`);
    return response.data;
  },
  checkEmail: async (email: string) => {
    const response = await apiClient.get<{ available: boolean }>(`/auth/check-email?email=${encodeURIComponent(email)}`);
    return response.data;
  },
  checkCard: async (cardNo: string) => {
    const response = await apiClient.get<{ available: boolean }>(`/auth/check-card?cardNo=${encodeURIComponent(cardNo)}`);
    return response.data;
  }
};

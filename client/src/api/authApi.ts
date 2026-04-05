import apiClient from './client';

export interface LoginPayload {
  email: string;
  motDePasse: string;
}

export interface AuthResponse {
  token: string;
  user?: any; // Depending on backend response
}

export const authApi = {
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  register: async (data: any): Promise<{ token: string }> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getProfile: async (): Promise<any> => {
    const response = await apiClient.get('/profile');
    return response.data;
  },

  submitQuestionnaire: async (data: { reponses: any[], notes: any[] }): Promise<{ message: string }> => {
    const response = await apiClient.post('/questionnaire', data);
    return response.data;
  }
};

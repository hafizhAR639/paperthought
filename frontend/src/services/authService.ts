import apiClient from '../utils/api';
import { User } from '../types';

export const authService = {
  async register(email: string, password: string, fullName: string): Promise<any> {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      fullName,
    });
    return response.data.data;
  },

  async login(email: string, password: string): Promise<any> {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data.data;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get('/auth/profile');
    return response.data.data;
  },
};

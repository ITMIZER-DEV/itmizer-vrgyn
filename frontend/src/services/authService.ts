import api from './api';
import { LoginDto, RegisterDto, User } from '../types/auth'; // Need to define types

export const authService = {
    login: async (credentials: LoginDto) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },
    register: async (data: RegisterDto) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data;
    },
    loginWithGoogle: async (token: string) => {
        const response = await api.post('/auth/google', { token });
        return response.data;
    },
};

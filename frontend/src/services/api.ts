import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 30000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        if (status === 401) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/auth') {
                window.location.href = '/auth';
            }
        } else if (status === 413) {
            console.error('[api] Payload muito grande (413) — verifique o tamanho dos dados enviados');
            error.userMessage = 'Os dados são muito grandes para salvar. Reduza a quantidade de itens e tente novamente.';
        } else if (status === 500) {
            console.error('[api] Erro interno do servidor (500):', error.config?.url);
        }
        return Promise.reject(error);
    }
);

export default api;

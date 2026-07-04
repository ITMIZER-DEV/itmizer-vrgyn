import api from './api';
// Force Vite refresh for AppRole export update

export type AppRole = 'admin' | 'supervisao' | 'user' | 'support' | 'seller' | 'migrador' | 'implantador';

export const AppRoleLabels: Record<AppRole, string> = {
    admin: 'Administrador',
    supervisao: 'Supervisão',
    user: 'Usuário',
    support: 'Suporte',
    seller: 'Vendedor',
    migrador: 'Migrador',
    implantador: 'Implantador',
};

export interface User {
    id: string;
    email: string;
    isActive: boolean;
    profile?: {
        fullName: string;
        theme?: string;
    };
    roles: { role: AppRole }[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserDto {
    email: string;
    password?: string;
    fullName?: string;
    role?: AppRole;
    theme?: string;
}

export const userService = {
    findAll: async () => {
        const response = await api.get<User[]>('/users');
        return response.data;
    },

    findOne: async (id: string) => {
        const response = await api.get<User>(`/users/${id}`);
        return response.data;
    },

    create: async (data: CreateUserDto) => {
        const response = await api.post<User>('/users', data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateUserDto>) => {
        const response = await api.patch<User>(`/users/${id}`, data);
        return response.data;
    },

    toggleActive: async (id: string) => {
        const response = await api.patch<User>(`/users/${id}/toggle-active`);
        return response.data;
    },

    updateRole: async (id: string, role: string) => {
        const response = await api.patch<User>(`/users/${id}/role`, { role });
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/users/${id}`);
    },
};

import api from './api';

export interface Client {
    id: string;
    nomeFantasia: string;
    razaoSocial?: string;
    cnpj: string;
    endereco?: string;
    contatoNome?: string;
    contatoEmail?: string;
    contatoTelefone?: string;
    driveLink?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateClientDto {
    nomeFantasia: string;
    razaoSocial?: string;
    cnpj: string;
    endereco?: string;
    contatoNome?: string;
    contatoEmail?: string;
    contatoTelefone?: string;
    driveLink?: string;
}

export const clientService = {
    findAll: async () => {
        const response = await api.get<Client[]>('/clients');
        return response.data;
    },

    findOne: async (id: string) => {
        const response = await api.get<Client>(`/clients/${id}`);
        return response.data;
    },

    create: async (data: CreateClientDto) => {
        const response = await api.post<Client>('/clients', data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateClientDto>) => {
        const response = await api.patch<Client>(`/clients/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/clients/${id}`);
    },
};

import api from './api';
import type {
  ClientCredential,
  CreateClientCredentialDto,
  UpdateClientCredentialMetadataDto,
} from '@/types/clientCredential';

export const clientCredentialService = {
  findAll: async (params?: { search?: string; clientId?: string }) => {
    const response = await api.get<ClientCredential[]>('/client-credentials', { params });
    return response.data;
  },
  findByClient: async (clientId: string) => {
    const response = await api.get<ClientCredential[]>(`/client-credentials/client/${clientId}`);
    return response.data;
  },
  create: async (data: CreateClientCredentialDto) => {
    const response = await api.post<ClientCredential>('/client-credentials', data);
    return response.data;
  },
  updateMetadata: async (id: string, data: UpdateClientCredentialMetadataDto) => {
    const response = await api.patch<ClientCredential>(`/client-credentials/${id}`, data);
    return response.data;
  },
  updateSecret: async (id: string, secret: string) => {
    const response = await api.patch<ClientCredential>(`/client-credentials/${id}/secret`, { secret });
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/client-credentials/${id}`);
  },
  reveal: async (id: string): Promise<string> => {
    const response = await api.get<{ secret: string }>(`/client-credentials/${id}/reveal`);
    return response.data.secret;
  },
  copy: async (id: string): Promise<string> => {
    const response = await api.post<{ secret: string }>(`/client-credentials/${id}/copy`);
    return response.data.secret;
  },
};

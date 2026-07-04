import api from './api';
import type { ClientInfrastructure, CreateClientInfrastructureDto } from '@/types/clientInfrastructure';

export const clientInfrastructureService = {
  findByClient: async (clientId: string) => {
    const response = await api.get<ClientInfrastructure[]>(`/client-infrastructure/client/${clientId}`);
    return response.data;
  },
  create: async (data: CreateClientInfrastructureDto) => {
    const response = await api.post<ClientInfrastructure>('/client-infrastructure', data);
    return response.data;
  },
  update: async (id: string, data: Partial<CreateClientInfrastructureDto>) => {
    const response = await api.patch<ClientInfrastructure>(`/client-infrastructure/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/client-infrastructure/${id}`);
  },
};

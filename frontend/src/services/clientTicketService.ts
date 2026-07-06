import api from './api';
import type { ClientTicket, CreateClientTicketDto } from '@/types/clientTicket';

export const clientTicketService = {
  findByClient: async (clientId: string) => {
    const response = await api.get<ClientTicket[]>(`/client-tickets/client/${clientId}`);
    return response.data;
  },
  create: async (data: CreateClientTicketDto) => {
    const response = await api.post<ClientTicket>('/client-tickets', data);
    return response.data;
  },
  update: async (id: string, data: Partial<CreateClientTicketDto>) => {
    const response = await api.patch<ClientTicket>(`/client-tickets/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/client-tickets/${id}`);
  },
};

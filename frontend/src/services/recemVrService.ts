import api from './api';
import type {
  RecemVr,
  RecemVrAcompanhamento,
  RecemVrHistory,
  CreateRecemVrPayload,
  UpdatePlanejamentoPayload,
  CreateAcompanhamentoPayload,
} from '../types/recemVr';

export const recemVrService = {
  findAll: async (): Promise<RecemVr[]> => {
    const response = await api.get<RecemVr[]>('/recem-vr');
    return response.data;
  },

  findOne: async (id: string): Promise<RecemVr> => {
    const response = await api.get<RecemVr>(`/recem-vr/${id}`);
    return response.data;
  },

  findByClient: async (clientId: string): Promise<RecemVr[]> => {
    const response = await api.get<RecemVr[]>(`/recem-vr/client/${clientId}`);
    return response.data;
  },

  // Etapa 1: Criação da Solicitação
  create: async (data: CreateRecemVrPayload): Promise<RecemVr> => {
    const response = await api.post<RecemVr>('/recem-vr', data);
    return response.data;
  },

  // Etapa 2: Planejamento do Suporte
  updatePlanejamento: async (id: string, data: UpdatePlanejamentoPayload): Promise<RecemVr> => {
    const response = await api.patch<RecemVr>(`/recem-vr/${id}/planejamento`, data);
    return response.data;
  },

  // Etapa 3: Registrar Reunião de Acompanhamento
  createAcompanhamento: async (
    id: string,
    data: CreateAcompanhamentoPayload,
  ): Promise<RecemVrAcompanhamento> => {
    const response = await api.post<RecemVrAcompanhamento>(`/recem-vr/${id}/acompanhamento`, data);
    return response.data;
  },

  removeAcompanhamento: async (id: string, acompId: string): Promise<void> => {
    await api.delete(`/recem-vr/${id}/acompanhamento/${acompId}`);
  },

  getHistory: async (id: string): Promise<RecemVrHistory[]> => {
    const response = await api.get<RecemVrHistory[]>(`/recem-vr/${id}/history`);
    return response.data;
  },

  // [ADMIN] Cancelar
  cancelar: async (id: string): Promise<RecemVr> => {
    const response = await api.patch<RecemVr>(`/recem-vr/${id}/cancelar`);
    return response.data;
  },

  // [ADMIN] Excluir permanentemente
  remove: async (id: string): Promise<void> => {
    await api.delete(`/recem-vr/${id}`);
  },
};

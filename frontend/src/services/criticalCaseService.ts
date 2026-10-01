import api from './api';
import type {
  CriticalCase,
  CreateCriticalCaseDto,
  UpdateCriticalCaseDto,
  CreateAcompanhamentoDto,
  CriticalCaseAcompanhamento,
  CriticalCaseStatus,
  CriticalCaseCategory,
} from '@/types/criticalCase';

export interface CriticalCaseFilters {
  clientId?: string;
  status?: CriticalCaseStatus;
  category?: CriticalCaseCategory;
  search?: string;
}

export const criticalCaseService = {
  findAll: async (filters?: CriticalCaseFilters) => {
    const response = await api.get<CriticalCase[]>('/critical-cases', { params: filters });
    return response.data;
  },

  findByClient: async (clientId: string) => {
    const response = await api.get<CriticalCase[]>(`/critical-cases/client/${clientId}`);
    return response.data;
  },

  findOne: async (id: string) => {
    const response = await api.get<CriticalCase>(`/critical-cases/${id}`);
    return response.data;
  },

  create: async (data: CreateCriticalCaseDto) => {
    const response = await api.post<CriticalCase>('/critical-cases', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCriticalCaseDto) => {
    const response = await api.patch<CriticalCase>(`/critical-cases/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/critical-cases/${id}`);
  },

  // === EVOLUÇÕES E ACOMPANHAMENTOS ===

  addAcompanhamento: async (id: string, data: CreateAcompanhamentoDto) => {
    const response = await api.post<CriticalCaseAcompanhamento>(`/critical-cases/${id}/acompanhamentos`, data);
    return response.data;
  },

  getAcompanhamentos: async (id: string) => {
    const response = await api.get<CriticalCaseAcompanhamento[]>(`/critical-cases/${id}/acompanhamentos`);
    return response.data;
  },

  deleteAcompanhamento: async (acompanhamentoId: string) => {
    await api.delete(`/critical-cases/acompanhamentos/${acompanhamentoId}`);
  },
};

import api from './api';
import { Client } from './clientService';
import { User } from './userService';

export type DeploymentStatus = 'ESCOPO' | 'PLANEJAMENTO' | 'IMPLANTACAO' | 'RECEM_VR' | 'CANCELADO';

export const DeploymentStatusLabels: Record<DeploymentStatus, string> = {
    ESCOPO: 'Escopo',
    PLANEJAMENTO: 'Planejamento',
    IMPLANTACAO: 'Implantação',
    RECEM_VR: 'Recém VR',
    CANCELADO: 'Cancelado',
};

export const DeploymentStatusColors: Record<DeploymentStatus, string> = {
    ESCOPO: 'bg-blue-100 text-blue-800',
    PLANEJAMENTO: 'bg-yellow-100 text-yellow-800',
    IMPLANTACAO: 'bg-purple-100 text-purple-800',
    RECEM_VR: 'bg-green-100 text-green-800',
    CANCELADO: 'bg-red-100 text-red-800',
};

export interface DeploymentHistory {
    id: string;
    deploymentId: string;
    userId?: string;
    user?: {
        email?: string;
        profile?: {
            fullName?: string;
        };
    };
    action: string;
    details?: string;
    oldStatus?: string;
    newStatus?: string;
    createdAt: string;
}

export interface Deployment {
    id: string;
    clientId: string;
    client?: Client;
    implantador?: string;
    dataInicio?: string | Date;
    dataPrevisao?: string | Date;
    driveDocumentacao?: string;
    observacao?: string;
    status: DeploymentStatus;
    createdAt: string;
    updatedAt: string;
    history?: DeploymentHistory[];
}

export interface CreateDeploymentDto {
    clientId: string;
    implantador?: string;
    dataInicio?: string | Date;
    dataPrevisao?: string | Date;
    driveDocumentacao?: string;
    observacao?: string;
    status?: DeploymentStatus;
}

export const deploymentService = {
    findAll: async () => {
        const response = await api.get<Deployment[]>('/deployments');
        return response.data;
    },

    findOne: async (id: string) => {
        const response = await api.get<Deployment>(`/deployments/${id}`);
        return response.data;
    },

    create: async (data: CreateDeploymentDto) => {
        const response = await api.post<Deployment>('/deployments', data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateDeploymentDto>) => {
        const response = await api.patch<Deployment>(`/deployments/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/deployments/${id}`);
    },

    addHistory: async (id: string, data: { action: string; details: string }) => {
        const response = await api.post<DeploymentHistory>(`/deployments/${id}/history`, data);
        return response.data;
    },
};

import api from './api';

export interface ServerRequirement {
    id: string;
    role: string;
    os: string;
    isRecommended: boolean;
    qntPdvsMin: number;
    qntPdvsMax: number;
    ramGb: number;
    cpuCores: number;
    cpuModel: string;
    storageType: string;
    storageGb: number;
    recommendedOs: string;
    software: string;
}

export interface TerminalRequirement {
    id: string;
    terminalType: string;
    os: string;
    application: string;
    ramGb: number;
    cpuModel: string;
    storageType: string;
    storageGb: number;
    minResolution: string;
    soDistribution: string;
    observations: string;
}

export interface InternetRequirement {
    id: string;
    linkType: string;
    uploadMb: number;
    downloadMb: number;
    observations: string;
}

export const infrastructureService = {
    getServers: async () => {
        const response = await api.get<ServerRequirement[]>('/infrastructure/servers');
        return response.data;
    },
    getTerminals: async () => {
        const response = await api.get<TerminalRequirement[]>('/infrastructure/terminals');
        return response.data;
    },
    getInternet: async () => {
        const response = await api.get<InternetRequirement[]>('/infrastructure/internet');
        return response.data;
    },
    updateServer: async (id: string, data: Partial<ServerRequirement>) => {
        const response = await api.patch<ServerRequirement>(`/infrastructure/servers/${id}`, data);
        return response.data;
    },
    updateTerminal: async (id: string, data: Partial<TerminalRequirement>) => {
        const response = await api.patch<TerminalRequirement>(`/infrastructure/terminals/${id}`, data);
        return response.data;
    },
    updateInternet: async (id: string, data: Partial<InternetRequirement>) => {
        const response = await api.patch<InternetRequirement>(`/infrastructure/internet/${id}`, data);
        return response.data;
    }
};

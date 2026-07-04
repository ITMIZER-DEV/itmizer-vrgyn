import api from './api';
import { AssessmentData } from '@/types/assessment';

const mapAssessment = (item: any): AssessmentData => {
    const data = item.data || {};
    return {
        ...data,
        id: item.id,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        clientId: item.clientId,
        status: item.status || data.status || 'rascunho',
        porte: item.porte || data.porte || 'pequeno',
        company: data.company || {
            nomeFantasia: item.client?.nomeFantasia || item.companyName || 'Sem Identificação',
            cnpj: item.client?.cnpj || item.cnpj || '',
            lojaTotalLojas: 1,
            lojaNumero: 1
        },
        servers: data.servers || [],
        pdvs: data.pdvs || [],
        backoffice: data.backoffice || [],
        network: data.network || { links: [] },
        peripherals: data.peripherals || { impressorasEtiqueta: [], consultaPreco: [], coletoresDados: [], outros: [] },
        operational: data.operational || { expediente: [], diasPico: [], horariosPico: [] },
        systems: data.systems || { integracaoCrm: false, integracaoEcommerce: false, integracaoMcommerce: false },
        projeto: data.projeto || {
            quantidadeHoras: item.projetoQuantidadeHoras || 0,
            escopoImplantacao: item.projetoEscopoImplantacao || '',
            usuarios: (item.projetoUsuarioNome || item.projetoUsuarioTelefone || item.projetoUsuarioFuncao) ? [{
                id: crypto.randomUUID(),
                nome: item.projetoUsuarioNome || '',
                telefone: item.projetoUsuarioTelefone || '',
                funcao: item.projetoUsuarioFuncao || ''
            }] : []
        },
        migracao: data.migracao || {
            tipo: item.migracaoTipo || 'padrao_bd',
            acessos: item.migracaoAcessos || {
                nomeContatoChave: '',
                telefone: '',
                acessoAnydesk: '',
                senhaAnydesk: ''
            },
            produtoPeriodo: item.migracaoProdutoPeriodo || 1,
            vendasPeriodo: item.migracaoVendasPeriodo || 1
        },
        history: item.history || [],
        validationResults: item.validationResults || []
    } as AssessmentData;
};

export const assessmentService = {
    findAll: async () => {
        const response = await api.get<any[]>('/assessments');
        return response.data.map(mapAssessment);
    },
    findOne: async (id: string) => {
        const response = await api.get<any>(`/assessments/${id}`);
        return mapAssessment(response.data);
    },
    findByClient: async (clientId: string) => {
        const response = await api.get<any[]>('/assessments');
        return response.data.filter((item: any) => item.clientId === clientId).map(mapAssessment);
    },
    create: async (data: any) => {
        // Strip redundant/large fields from data object
        const { history, validationResults, ...cleanData } = data;
        
        const payload = {
            clientId: data.clientId,
            companyName: data.company?.nomeFantasia || data.companyName,
            cnpj: data.company?.cnpj || data.cnpj,
            status: data.status,
            porte: data.porte,
            data: cleanData,
            validationResults: data.validationResults
        };

        const response = await api.post('/assessments', payload);
        return mapAssessment(response.data);
    },
    update: async (id: string, data: any) => {
        const { history, validationResults, ...cleanData } = data;

        const payload = {
            clientId: data.clientId,
            companyName: data.company?.nomeFantasia || data.companyName,
            cnpj: data.company?.cnpj || data.cnpj,
            status: data.status,
            porte: data.porte,
            data: cleanData,
            // validationResults excluído do auto-save — só atualizado via /validate
            migracaoTipo: data.migracao?.tipo,
            migracaoAcessos: data.migracao?.acessos,
            migracaoProdutoPeriodo: data.migracao?.produtoPeriodo,
            migracaoVendasPeriodo: data.migracao?.vendasPeriodo
        };
        const response = await api.patch(`/assessments/${id}`, payload);
        return mapAssessment(response.data);
    },
    delete: async (id: string) => {
        return api.delete(`/assessments/${id}`);
    },
    validate: async (id: string) => {
        const response = await api.get(`/assessments/${id}/validate`);
        return response.data;
    },
    toggleRelease: async (id: string, itemId: string, field: string) => {
        const response = await api.post(`/assessments/${id}/release`, { itemId, field });
        return response.data;
    },
    getHistory: async (id: string) => {
        const response = await api.get<any[]>(`/assessments/${id}/history`);
        return response.data;
    }
};

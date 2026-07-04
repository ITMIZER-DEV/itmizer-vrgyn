import api from './api';
import { Client } from './clientService';

export type MigrationStatus = 'pendente' | 'em_validacao' | 'em_andamento' | 'concluida' | 'cancelada';

export const MigrationStatusLabels: Record<MigrationStatus, string> = {
    pendente: 'Pendente',
    em_validacao: 'Em Validação',
    em_andamento: 'Em Andamento',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
};

export const MigrationStatusColors: Record<MigrationStatus, string> = {
    pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    em_validacao: 'bg-purple-100 text-purple-800 border-purple-200',
    em_andamento: 'bg-blue-100 text-blue-800 border-blue-200',
    concluida: 'bg-green-100 text-green-800 border-green-200',
    cancelada: 'bg-red-100 text-red-800 border-red-200',
};

export interface MigrationItem {
    migrar: boolean;
    tempoEstimado: string;
    observacoes: string;
    anexo?: string; // Nome do arquivo anexado (futura implementação de upload)
    [key: string]: any;
}

export interface MigrationItems {
    cadastroProduto: MigrationItem & { trabalhaAtacado: boolean; trazerAtacadoAtual: boolean; trabalhaPautaFiscal: boolean };
    mercadologico: MigrationItem & { contratouFerramenta: boolean; usarPadraoVR: boolean };
    familiaProdutos: MigrationItem;
    produtoFornecedor: MigrationItem;
    balanca: MigrationItem & { temArquivoBalanca: boolean };
    fornecedor: MigrationItem;
    clientePreferencial: MigrationItem;
    convenio: MigrationItem;
    cheque: MigrationItem & { controlaPeloSistema: boolean };
    creditoRotativo: MigrationItem & { controlaPeloSistema: boolean };
    contasPagar: MigrationItem & { controlaPeloSistema: boolean };
    contasReceberFornecedor: MigrationItem & { controlaPeloSistema: boolean };
    outrasDespesas: MigrationItem & { controlaPeloSistema: boolean };
    historicoVendas: MigrationItem;
    mapaTributacao: MigrationItem & { empresaResponsavel?: string };
}

export const defaultMigrationItems: MigrationItems = {
    cadastroProduto: { migrar: false, tempoEstimado: '6 horas', observacoes: '', trabalhaAtacado: false, trazerAtacadoAtual: false, trabalhaPautaFiscal: false },
    mercadologico: { migrar: false, tempoEstimado: '2 horas', observacoes: '', contratouFerramenta: false, usarPadraoVR: false },
    familiaProdutos: { migrar: false, tempoEstimado: '1 hora', observacoes: '' },
    produtoFornecedor: { migrar: false, tempoEstimado: '1 hora', observacoes: '' },
    balanca: { migrar: false, tempoEstimado: '1 hora', observacoes: '', temArquivoBalanca: false },
    fornecedor: { migrar: false, tempoEstimado: '2 horas', observacoes: '' },
    clientePreferencial: { migrar: false, tempoEstimado: '2 horas', observacoes: '' },
    convenio: { migrar: false, tempoEstimado: '4 horas', observacoes: '' },
    cheque: { migrar: false, tempoEstimado: '4 horas', observacoes: '', controlaPeloSistema: false },
    creditoRotativo: { migrar: false, tempoEstimado: '4 horas', observacoes: '', controlaPeloSistema: false },
    contasPagar: { migrar: false, tempoEstimado: '4 horas', observacoes: '', controlaPeloSistema: false },
    contasReceberFornecedor: { migrar: false, tempoEstimado: '4 horas', observacoes: '', controlaPeloSistema: false },
    outrasDespesas: { migrar: false, tempoEstimado: '4 horas', observacoes: '', controlaPeloSistema: false },
    historicoVendas: { migrar: false, tempoEstimado: '8 horas', observacoes: '' },
    mapaTributacao: { migrar: false, tempoEstimado: '2 horas', observacoes: '', empresaResponsavel: '' },
};

export interface MigrationHistoryEntry {
    id: string;
    action: string;
    details?: string;
    oldStatus?: string;
    newStatus?: string;
    userId?: string;
    user?: {
        id: string;
        email: string;
        profile?: {
            fullName?: string;
        };
    };
    createdAt: string;
}

export interface Migration {
    id: string;
    clientId: string;
    client?: Client;
    status: MigrationStatus;
    tipoMigracao?: 'padrao' | 'planilha' | 'consultoria';
    responsavelId?: string;
    responsavel?: { id: string; email: string; profile?: { fullName: string } };
    tipoCobranca?: 'hora' | 'valor_fixo';
    valorHora?: number;
    valorFixo?: number;
    nomeContatoChave?: string;
    telefone?: string;
    acessoAnydesk?: string;
    senhaAnydesk?: string;
    nomeSistema?: string;
    nomeSoftwareHouse?: string;
    tipoBancoDados?: string;
    items: MigrationItems;
    observacoes?: string;
    statusFinanceiro?: string;
    dataPrevistaVirada?: string;
    dataViradaSistema?: string;
    history?: MigrationHistoryEntry[];
    lancamentos?: MigrationLancamento[];
    _count?: { history: number };
    createdAt: string;
    updatedAt: string;
}

export interface CreateMigrationDto {
    clientId: string;
    tipoMigracao?: 'padrao' | 'planilha' | 'consultoria';
    responsavelId?: string;
    tipoCobranca?: 'hora' | 'valor_fixo';
    valorHora?: number;
    valorFixo?: number;
    nomeContatoChave?: string;
    telefone?: string;
    acessoAnydesk?: string;
    senhaAnydesk?: string;
    nomeSistema?: string;
    nomeSoftwareHouse?: string;
    tipoBancoDados?: string;
    items?: MigrationItems;
    observacoes?: string;
    statusFinanceiro?: string;
    status?: MigrationStatus;
    dataPrevistaVirada?: string;
    dataViradaSistema?: string;
}

export interface MigrationLancamento {
    id: string;
    migrationId: string;
    userId: string;
    user?: { id: string; email: string; profile?: { fullName: string } };
    data: string;
    horas?: number;
    valor?: number;
    descricao?: string;
    createdAt: string;
}

export const migrationService = {
    findAll: async () => {
        const response = await api.get<Migration[]>('/migrations');
        return response.data;
    },
    findByClient: async (clientId: string) => {
        const response = await api.get<Migration[]>(`/migrations/client/${clientId}`);
        return response.data;
    },
    findOne: async (id: string) => {
        const response = await api.get<Migration>(`/migrations/${id}`);
        return response.data;
    },
    create: async (data: CreateMigrationDto) => {
        const response = await api.post<Migration>('/migrations', data);
        return response.data;
    },
    update: async (id: string, data: Partial<CreateMigrationDto>) => {
        const response = await api.patch<Migration>(`/migrations/${id}`, data);
        return response.data;
    },
    addHistory: async (id: string, data: { action: string; details?: string }) => {
        const response = await api.post<MigrationHistoryEntry>(`/migrations/${id}/history`, data);
        return response.data;
    },

    addLancamento: async (id: string, data: { data?: string; horas?: number; valor?: number; descricao?: string }) => {
        const response = await api.post<MigrationLancamento>(`/migrations/${id}/lancamentos`, data);
        return response.data;
    },

    chargeback: async (id: string, data: { password: string; reason: string }) => {
        const response = await api.post<Migration>(`/migrations/${id}/chargeback`, data);
        return response.data;
    },

    remove: async (id: string) => {
        await api.delete(`/migrations/${id}`);
    },
    getHistory: async (id: string) => {
        const response = await api.get<MigrationHistoryEntry[]>(`/migrations/${id}/history`);
        return response.data;
    }
};

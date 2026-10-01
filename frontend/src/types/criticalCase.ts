export type CriticalCaseStatus = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO' | 'CANCELADO';

export type CriticalCaseCategory =
  | 'ALINHAMENTO'
  | 'CHAMADO'
  | 'REUNIAO'
  | 'RECLAMACAO'
  | 'TREINAMENTO'
  | 'LEVANTAMENTOS'
  | 'PROJETOS'
  | 'INFORMATIVO';

export const CRITICAL_CASE_CATEGORY_LABELS: Record<CriticalCaseCategory, string> = {
  ALINHAMENTO: 'Alinhamento',
  CHAMADO: 'Chamado',
  REUNIAO: 'Reunião',
  RECLAMACAO: 'Reclamação',
  TREINAMENTO: 'Treinamento',
  LEVANTAMENTOS: 'Levantamentos',
  PROJETOS: 'Projetos',
  INFORMATIVO: 'Informativo',
};

export const CRITICAL_CASE_CATEGORY_COLORS: Record<CriticalCaseCategory, string> = {
  ALINHAMENTO: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900',
  CHAMADO: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900',
  REUNIAO: 'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-900',
  RECLAMACAO: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-900',
  TREINAMENTO: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900',
  LEVANTAMENTOS: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900',
  PROJETOS: 'bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:border-cyan-900',
  INFORMATIVO: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800',
};

export const CRITICAL_CASE_STATUS_LABELS: Record<CriticalCaseStatus, string> = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em Andamento',
  RESOLVIDO: 'Resolvido',
  CANCELADO: 'Cancelado',
};

export const CRITICAL_CASE_STATUS_COLORS: Record<CriticalCaseStatus, string> = {
  ABERTO: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  RESOLVIDO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELADO: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
};

export interface CriticalCaseAcompanhamento {
  id: string;
  criticalCaseId: string;
  userId?: string | null;
  user?: {
    id: string;
    email: string;
    profile?: {
      fullName?: string | null;
    } | null;
  } | null;
  data: string;
  tipo: string;
  descricao: string;
  proximosPassos?: string | null;
  statusNovo?: CriticalCaseStatus | null;
  createdAt: string;
}

export interface CriticalCase {
  id: string;
  clientId: string;
  client?: {
    id: string;
    nomeFantasia: string;
    razaoSocial?: string | null;
    cnpj: string;
    driveLink?: string | null;
    credentials?: Array<{
      id: string;
      type: string;
      label: string;
      username?: string | null;
      responsavelNome?: string | null;
      responsavelTelefone?: string | null;
      responsavelEmail?: string | null;
      notes?: string | null;
      createdAt: string;
    }>;
  };
  categories: CriticalCaseCategory[];
  participantes?: string | null;
  observacoes?: string | null;
  proximosPassos?: string | null;
  status: CriticalCaseStatus;
  responsavelId?: string | null;
  responsavel?: {
    id: string;
    email: string;
    profile?: {
      fullName?: string | null;
    } | null;
  } | null;
  acompanhamentos?: CriticalCaseAcompanhamento[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCriticalCaseDto {
  clientId: string;
  categories?: CriticalCaseCategory[];
  participantes?: string;
  observacoes?: string;
  proximosPassos?: string;
  status?: CriticalCaseStatus;
  responsavelId?: string;
}

export interface CreateAcompanhamentoDto {
  data?: string;
  tipo?: string;
  descricao: string;
  proximosPassos?: string;
  statusNovo?: CriticalCaseStatus;
}

export type UpdateCriticalCaseDto = Partial<CreateCriticalCaseDto>;

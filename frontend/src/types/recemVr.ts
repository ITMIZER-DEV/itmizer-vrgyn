export type RecemVrCriticidade = 'BAIXA' | 'MEDIA' | 'ALTA';
export type RecemVrStatus = 'PLANEJAMENTO' | 'EM_ANDAMENTO' | 'CRITICO' | 'FINALIZADA' | 'CANCELADA';

export const CRITICIDADE_LABELS: Record<RecemVrCriticidade, string> = {
  BAIXA: '1 - Baixa',
  MEDIA: '2 - Média',
  ALTA: '3 - Alta',
};

export const CRITICIDADE_PERIODICIDADE: Record<RecemVrCriticidade, string> = {
  BAIXA: '30 dias · mensal',
  MEDIA: '15 dias · quinzenal',
  ALTA: '7 dias · semanal',
};

export const STATUS_LABELS: Record<RecemVrStatus, string> = {
  PLANEJAMENTO: 'Planejamento',
  EM_ANDAMENTO: 'Em Andamento',
  CRITICO: 'Crítico',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
};

export const STATUS_COLORS: Record<RecemVrStatus, string> = {
  PLANEJAMENTO: 'bg-blue-100 text-blue-800',
  EM_ANDAMENTO: 'bg-yellow-100 text-yellow-800',
  CRITICO: 'bg-red-100 text-red-800',
  FINALIZADA: 'bg-green-100 text-green-800',
  CANCELADA: 'bg-slate-100 text-slate-500',
};

export const CRITICIDADE_COLORS: Record<RecemVrCriticidade, string> = {
  BAIXA: 'bg-green-100 text-green-800',
  MEDIA: 'bg-yellow-100 text-yellow-800',
  ALTA: 'bg-red-100 text-red-800',
};

export interface RecemVrUser {
  id: string;
  email: string;
  profile?: { fullName?: string | null };
}

export interface RecemVrClient {
  id: string;
  nomeFantasia: string;
  cnpj: string;
  contatoNome?: string | null;
  contatoEmail?: string | null;
}

export interface RecemVrAcompanhamento {
  id: string;
  recemVrId: string;
  dataReuniao: string;
  ata?: string | null;
  observacao?: string | null;
  user?: RecemVrUser | null;
  createdAt: string;
}

export interface RecemVrHistory {
  id: string;
  action: string;
  details?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
  user?: RecemVrUser | null;
  createdAt: string;
}

export interface RecemVr {
  id: string;
  clientId: string;
  client: RecemVrClient;
  deploymentId?: string | null;
  mv067?: string | null;
  criticidade: RecemVrCriticidade;
  resumo: string;
  solicitante?: RecemVrUser | null;
  status: RecemVrStatus;
  analistaId?: string | null;
  analista?: RecemVrUser | null;
  dataPrimeiraReuniao?: string | null;
  datasAcompanhamento: string[];
  acompanhamentos?: RecemVrAcompanhamento[];
  history?: RecemVrHistory[];
  _count?: { acompanhamentos: number };
  createdAt: string;
  updatedAt: string;
}

// DTOs de entrada
export interface CreateRecemVrPayload {
  clientId: string;
  deploymentId?: string;
  mv067?: string;
  criticidade?: RecemVrCriticidade;
  resumo: string;
}

export interface UpdatePlanejamentoPayload {
  dataPrimeiraReuniao?: string;
  datasAcompanhamento?: string[];
  status?: RecemVrStatus;
  analistaId?: string;
}

export interface CreateAcompanhamentoPayload {
  dataReuniao: string;
  ata?: string;
  observacao?: string;
}

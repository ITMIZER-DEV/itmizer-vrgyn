export type ClientInfraType =
  | 'SERVIDOR_BANCO'
  | 'SERVIDOR_APLICACAO'
  | 'SERVIDOR_GERENCIADOR'
  | 'ESTACAO_TRABALHO'
  | 'TERMINAL_PDV';

export const CLIENT_INFRA_TYPE_LABELS: Record<ClientInfraType, string> = {
  SERVIDOR_BANCO: 'Servidor de Banco de Dados',
  SERVIDOR_APLICACAO: 'Servidor de Aplicação',
  SERVIDOR_GERENCIADOR: 'Servidor Gerenciador',
  ESTACAO_TRABALHO: 'Estação de Trabalho',
  TERMINAL_PDV: 'Terminal / PDV',
};

export interface ClientInfrastructure {
  id: string;
  clientId: string;
  type: ClientInfraType;
  nome: string;
  hostname?: string | null;
  ipAddress?: string | null;
  operatingSystem?: string | null;
  cpuModel?: string | null;
  ramGb?: number | null;
  storageGb?: number | null;
  storageType?: string | null;
  observacoes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInfrastructureDto {
  clientId: string;
  type: ClientInfraType;
  nome: string;
  hostname?: string;
  ipAddress?: string;
  operatingSystem?: string;
  cpuModel?: string;
  ramGb?: number;
  storageGb?: number;
  storageType?: string;
  observacoes?: string;
}

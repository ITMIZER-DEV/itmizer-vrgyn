export type ClientCredentialType = 'ACESSO_REMOTO' | 'BANCO_DADOS' | 'VPN' | 'SISTEMA_APLICACAO' | 'OUTRO';

export const CLIENT_CREDENTIAL_TYPE_LABELS: Record<ClientCredentialType, string> = {
  ACESSO_REMOTO: 'Acesso Remoto',
  BANCO_DADOS: 'Banco de Dados',
  VPN: 'VPN',
  SISTEMA_APLICACAO: 'Sistema / Aplicação',
  OUTRO: 'Outro',
};

export interface ClientCredential {
  id: string;
  clientId: string;
  type: ClientCredentialType;
  label: string;
  username?: string | null;
  responsavelNome?: string | null;
  responsavelTelefone?: string | null;
  responsavelEmail?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientCredentialDto {
  clientId: string;
  type: ClientCredentialType;
  label: string;
  username?: string;
  secret: string;
  responsavelNome?: string;
  responsavelTelefone?: string;
  responsavelEmail?: string;
  notes?: string;
}

export type UpdateClientCredentialMetadataDto = Partial<Omit<CreateClientCredentialDto, 'clientId' | 'secret'>>;

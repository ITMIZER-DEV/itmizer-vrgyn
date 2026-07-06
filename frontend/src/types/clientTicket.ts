export type TicketUrgencia = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export const TICKET_URGENCIA_LABELS: Record<TicketUrgencia, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export const TICKET_URGENCIA_COLORS: Record<TicketUrgencia, string> = {
  BAIXA: 'bg-slate-100 text-slate-700 border-transparent',
  MEDIA: 'bg-blue-100 text-blue-800 border-transparent',
  ALTA: 'bg-orange-100 text-orange-800 border-transparent',
  CRITICA: 'bg-red-100 text-red-800 border-transparent',
};

export interface ClientTicket {
  id: string;
  clientId: string;
  data: string;
  numero: string;
  assunto: string;
  classificacao: TicketUrgencia;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientTicketDto {
  clientId: string;
  data: string;
  numero: string;
  assunto: string;
  classificacao: TicketUrgencia;
}

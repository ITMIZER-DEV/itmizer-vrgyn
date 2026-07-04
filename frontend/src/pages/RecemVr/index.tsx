import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Sparkles, AlertTriangle, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { recemVrService } from '@/services/recemVrService';
import {
  CRITICIDADE_LABELS,
  CRITICIDADE_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  type RecemVrCriticidade,
  type RecemVrStatus,
} from '@/types/recemVr';

export default function RecemVrList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<RecemVrStatus | 'TODOS'>('TODOS');
  const [filterCriticidade, setFilterCriticidade] = useState<RecemVrCriticidade | 'TODAS'>('TODAS');
  const navigate = useNavigate();
  const { canEdit } = usePermissions('/recem-vr');

  const { data: recemVrList, isLoading } = useQuery({
    queryKey: ['recem-vr'],
    queryFn: recemVrService.findAll,
  });

  const filtered = recemVrList?.filter((rv) => {
    const matchSearch =
      rv.client?.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rv.analista?.profile?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    const matchStatus = filterStatus === 'TODOS' || rv.status === filterStatus;
    const matchCrit = filterCriticidade === 'TODAS' || rv.criticidade === filterCriticidade;
    return matchSearch && matchStatus && matchCrit;
  });

  // Próxima reunião de acompanhamento a partir de hoje
  const getProximaReuniao = (datasAcompanhamento: string[]) => {
    const hoje = new Date();
    const futuras = datasAcompanhamento
      .map((d) => new Date(d))
      .filter((d) => d >= hoje)
      .sort((a, b) => a.getTime() - b.getTime());
    return futuras[0] ?? null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-emerald-600" />
              Recém VR
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Acompanhe clientes em período pós-implantação.
            </p>
          </div>

          {canEdit && (
            <Button
              onClick={() => navigate('/recem-vr/new')}
              className="gap-2 shrink-0 bg-emerald-600 hover:bg-emerald-700 shadow-md"
            >
              <Plus className="w-4 h-4" /> Nova Solicitação
            </Button>
          )}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Filtros */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 bg-slate-50/50">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou analista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white border-slate-200 focus-visible:ring-emerald-500 rounded-full"
              />
            </div>

            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as RecemVrStatus | 'TODOS')}
            >
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os Status</SelectItem>
                {(Object.keys(STATUS_LABELS) as RecemVrStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterCriticidade}
              onValueChange={(v) => setFilterCriticidade(v as RecemVrCriticidade | 'TODAS')}
            >
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Criticidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas as Criticidades</SelectItem>
                {(Object.keys(CRITICIDADE_LABELS) as RecemVrCriticidade[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CRITICIDADE_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700 h-12">Cliente</TableHead>
                  <TableHead className="font-semibold text-slate-700 h-12">Criticidade</TableHead>
                  <TableHead className="font-semibold text-slate-700 h-12">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700 h-12">Analista</TableHead>
                  <TableHead className="font-semibold text-slate-700 h-12">Próxima Reunião</TableHead>
                  <TableHead className="font-semibold text-slate-700 h-12">Reuniões</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-[180px]" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-[100px] rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                      </TableRow>
                    ))
                  : filtered?.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Nenhum Recém VR encontrado.{searchTerm && ' Tente outro termo.'}
                      </TableCell>
                    </TableRow>
                  )
                  : filtered?.map((rv) => {
                      const proximaReuniao = getProximaReuniao(rv.datasAcompanhamento);
                      const isAlta = rv.criticidade === 'ALTA';

                      return (
                        <TableRow
                          key={rv.id}
                          className={`group hover:bg-slate-50/80 transition-colors cursor-pointer ${
                            isAlta ? 'border-l-4 border-l-red-400' : ''
                          }`}
                          onClick={() => navigate(`/recem-vr/${rv.id}`)}
                        >
                          <TableCell className="font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              {isAlta && (
                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                              )}
                              <span className="hover:text-emerald-600 transition-colors">
                                {rv.client?.nomeFantasia}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${CRITICIDADE_COLORS[rv.criticidade]} border-0 rounded-full px-3 py-1 font-medium`}
                            >
                              {CRITICIDADE_LABELS[rv.criticidade]}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${STATUS_COLORS[rv.status]} border-0 rounded-full px-3 py-1 font-medium`}
                            >
                              {STATUS_LABELS[rv.status]}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-slate-600">
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              {rv.analista?.profile?.fullName ??
                                rv.analista?.email ?? (
                                  <span className="text-slate-400 italic">Não atribuído</span>
                                )}
                            </div>
                          </TableCell>

                          <TableCell>
                            {proximaReuniao ? (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {format(proximaReuniao, 'dd/MM/yyyy', { locale: ptBR })}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-sm">Sem agenda</span>
                            )}
                          </TableCell>

                          <TableCell className="text-slate-600 text-sm">
                            {rv._count?.acompanhamentos ?? 0} registros
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

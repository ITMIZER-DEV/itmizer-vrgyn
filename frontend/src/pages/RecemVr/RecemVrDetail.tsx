import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, AlertTriangle, Calendar, FileText, Clock, Plus, Trash2, ExternalLink, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { userService } from '@/services/userService';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { recemVrService } from '@/services/recemVrService';
import {
  CRITICIDADE_LABELS, CRITICIDADE_COLORS, STATUS_LABELS, STATUS_COLORS,
  type RecemVrStatus, type RecemVrCriticidade,
} from '@/types/recemVr';
import { CriticidadeSelector } from '@/components/CriticidadeSelector';

export default function RecemVrDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canEdit } = usePermissions('/recem-vr');
  const { isAdmin } = useAuth();

  // Estado: solicitação (edição)
  const [editCriticidade, setEditCriticidade] = useState(false);
  const [novaCriticidade, setNovaCriticidade] = useState<RecemVrCriticidade | ''>('');
  const [editMv067, setEditMv067] = useState(false);
  const [novoMv067, setNovoMv067] = useState('');

  // Estado: planejamento
  const [analistaId, setAnalistaId] = useState('');
  const [status, setStatus] = useState<RecemVrStatus | ''>('');
  const [dataPrimeira, setDataPrimeira] = useState('');
  const [novaDataAcomp, setNovaDataAcomp] = useState('');

  // Estado: acompanhamento
  const [dataReuniao, setDataReuniao] = useState('');
  const [ata, setAta] = useState('');
  const [observacao, setObservacao] = useState('');

  const { data: rv, isLoading } = useQuery({
    queryKey: ['recem-vr', id],
    queryFn: () => recemVrService.findOne(id!),
    enabled: !!id,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: userService.findAll,
  });

  const planejamentoMutation = useMutation({
    mutationFn: (data: Parameters<typeof recemVrService.updatePlanejamento>[1]) =>
      recemVrService.updatePlanejamento(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recem-vr', id] });
      toast({ title: 'Planejamento atualizado!' });
    },
    onError: () => toast({ title: 'Erro', variant: 'destructive' }),
  });

  // Mutation para editar campos da Solicitação (criticidade, mv067)
  const solicitacaoMutation = useMutation({
    mutationFn: (data: Parameters<typeof recemVrService.updatePlanejamento>[1]) =>
      recemVrService.updatePlanejamento(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recem-vr', id] });
      setEditCriticidade(false);
      setEditMv067(false);
      toast({ title: 'Registro atualizado com histórico!' });
    },
    onError: () => toast({ title: 'Erro ao salvar', variant: 'destructive' }),
  });

  const acompanhamentoMutation = useMutation({
    mutationFn: () => recemVrService.createAcompanhamento(id!, { dataReuniao, ata, observacao }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recem-vr', id] });
      setDataReuniao(''); setAta(''); setObservacao('');
      toast({ title: 'Reunião registrada!' });
    },
    onError: () => toast({ title: 'Erro ao registrar reunião', variant: 'destructive' }),
  });

  const removeAcompMutation = useMutation({
    mutationFn: (acompId: string) => recemVrService.removeAcompanhamento(id!, acompId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recem-vr', id] });
      toast({ title: 'Acompanhamento removido.' });
    },
  });

  const adicionarData = () => {
    if (!novaDataAcomp) return;
    const atuais = rv?.datasAcompanhamento ?? [];
    planejamentoMutation.mutate({ datasAcompanhamento: [...atuais, novaDataAcomp] });
    setNovaDataAcomp('');
  };

  const cancelarMutation = useMutation({
    mutationFn: () => recemVrService.cancelar(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recem-vr', id] });
      toast({ title: 'Recém VR cancelado.' });
    },
    onError: () => toast({ title: 'Erro ao cancelar', variant: 'destructive' }),
  });

  const removeMutation = useMutation({
    mutationFn: () => recemVrService.remove(id!),
    onSuccess: () => {
      toast({ title: 'Registro excluído permanentemente.' });
      navigate('/recem-vr');
    },
    onError: () => toast({ title: 'Erro ao excluir', variant: 'destructive' }),
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-5xl mx-auto">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!rv) return <DashboardLayout><p className="p-8 text-center">Recém VR não encontrado.</p></DashboardLayout>;

  const isAlta = rv.criticidade === 'ALTA';

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/recem-vr')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-emerald-600" />
                {rv.client.nomeFantasia}
              </h1>
              {isAlta && (
                <Badge className="bg-red-100 text-red-700 border-0 gap-1">
                  <AlertTriangle className="w-3 h-3" /> Criticidade Alta
                </Badge>
              )}
              {rv.status === 'CANCELADA' && (
                <Badge className="bg-slate-100 text-slate-500 border-0">Cancelado</Badge>
              )}
            </div>
            <div className="flex gap-2 mt-2 flex-wrap items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="outline" className={`${CRITICIDADE_COLORS[rv.criticidade]} border-0`}>
                  {CRITICIDADE_LABELS[rv.criticidade]}
                </Badge>
                <Badge variant="outline" className={`${STATUS_COLORS[rv.status]} border-0`}>
                  {STATUS_LABELS[rv.status]}
                </Badge>
              </div>

              {/* Ações exclusivas de admin */}
              {isAdmin && rv.status !== 'CANCELADA' && rv.status !== 'FINALIZADA' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm"
                      className="text-primary border-primary/20 hover:bg-primary/10 gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Cancelar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar Recém VR?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O registro será marcado como cancelado. Esta ação fica registrada no histórico.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction
                        className="gradient-primary"
                        onClick={() => cancelarMutation.mutate()}
                      >
                        Confirmar Cancelamento
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm"
                      className="text-destructive border-destructive/20 hover:bg-destructive/10 gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Todos os acompanhamentos e o histórico serão apagados. Esta ação <strong>não pode ser desfeita</strong>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => removeMutation.mutate()}
                      >
                        Excluir Permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="solicitacao">
          <TabsList className="w-full">
            <TabsTrigger value="solicitacao" className="flex-1">Solicitação</TabsTrigger>
            <TabsTrigger value="planejamento" className="flex-1">Planejamento</TabsTrigger>
            <TabsTrigger value="acompanhamentos" className="flex-1">
              Acompanhamentos ({rv.acompanhamentos?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex-1">Histórico</TabsTrigger>
          </TabsList>

          {/* ABA: SOLICITAÇÃO */}
          <TabsContent value="solicitacao">
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</p>
                  <p className="font-medium">{rv.client.nomeFantasia}</p>
                  <p className="text-sm text-muted-foreground">CNPJ: {rv.client.cnpj}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Solicitante</p>
                  <p className="font-medium">
                    {rv.solicitante?.profile?.fullName ?? rv.solicitante?.email ?? 'N/A'}
                  </p>
                </div>
              </div>

              {/* MV067 — editável */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    MV067 — Termo de Encerramento
                  </p>
                  {canEdit && !editMv067 && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1"
                      onClick={() => { setEditMv067(true); setNovoMv067(rv.mv067 ?? ''); }}>
                      <Pencil className="w-3 h-3" /> Editar
                    </Button>
                  )}
                </div>
                {editMv067 ? (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      placeholder="https://drive.google.com/..."
                      value={novoMv067}
                      onChange={(e) => setNovoMv067(e.target.value)}
                    />
                    <Button size="sm" className="gradient-primary shrink-0"
                      disabled={solicitacaoMutation.isPending}
                      onClick={() => solicitacaoMutation.mutate({ mv067: novoMv067 } as any)}>
                      Salvar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditMv067(false)}>Cancelar</Button>
                  </div>
                ) : rv.mv067 ? (
                  <a href={rv.mv067} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <FileText className="w-4 h-4" />
                    Abrir Termo de Encerramento
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Não informado</p>
                )}
              </div>

              {/* CRITICIDADE — editável com histórico */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Criticidade</p>
                  {canEdit && !editCriticidade && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1"
                      onClick={() => { setEditCriticidade(true); setNovaCriticidade(rv.criticidade); }}>
                      <Pencil className="w-3 h-3" /> Editar
                    </Button>
                  )}
                </div>
                {editCriticidade ? (
                  <div className="space-y-3">
                    <CriticidadeSelector
                      value={(novaCriticidade || rv.criticidade) as RecemVrCriticidade}
                      onChange={(v) => setNovaCriticidade(v)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="gradient-primary"
                        disabled={solicitacaoMutation.isPending}
                        onClick={() => solicitacaoMutation.mutate({ criticidade: (novaCriticidade || rv.criticidade) as RecemVrCriticidade })}>
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditCriticidade(false)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className={`${CRITICIDADE_COLORS[rv.criticidade]} border-0 text-sm px-3 py-1`}
                  >
                    {CRITICIDADE_LABELS[rv.criticidade]}
                  </Badge>
                )}
              </div>

              {/* RESUMO */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Resumo</p>
                <div className="bg-muted p-3 rounded-md border text-sm text-foreground whitespace-pre-wrap">
                  {rv.resumo}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Criado em {format(new Date(rv.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </TabsContent>

          {/* ABA: PLANEJAMENTO */}
          <TabsContent value="planejamento">
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2">
                  <Select
                    value={status || rv.status}
                    onValueChange={(v) => setStatus(v as RecemVrStatus)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABELS) as RecemVrStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {canEdit && (
                    <Button
                      onClick={() => planejamentoMutation.mutate({ status: (status || rv.status) as RecemVrStatus })}
                      disabled={planejamentoMutation.isPending}
                      className="gradient-primary"
                    >
                      Salvar
                    </Button>
                  )}
                </div>
              </div>

              {/* Analista */}
              <div className="space-y-2">
                <Label>Analista Responsável</Label>
                <div className="flex gap-2">
                  <Select
                    value={analistaId || rv.analistaId || ''}
                    onValueChange={setAnalistaId}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar analista..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.profile?.fullName ?? u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {canEdit && (
                    <Button
                      onClick={() => planejamentoMutation.mutate({ analistaId: analistaId || rv.analistaId || undefined })}
                      disabled={planejamentoMutation.isPending}
                      className="gradient-primary"
                    >
                      Salvar
                    </Button>
                  )}
                </div>
                {rv.analista && (
                  <p className="text-sm text-muted-foreground">
                    Atual: {rv.analista.profile?.fullName ?? rv.analista.email}
                  </p>
                )}
              </div>

              {/* 1ª Reunião */}
              <div className="space-y-2">
                <Label>Data da 1ª Reunião</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dataPrimeira || (rv.dataPrimeiraReuniao ? rv.dataPrimeiraReuniao.split('T')[0] : '')}
                    onChange={(e) => setDataPrimeira(e.target.value)}
                    disabled={!canEdit}
                  />
                  {canEdit && (
                    <Button
                      onClick={() => planejamentoMutation.mutate({ dataPrimeiraReuniao: dataPrimeira })}
                      disabled={planejamentoMutation.isPending || !dataPrimeira}
                      className="gradient-primary"
                    >
                      Salvar
                    </Button>
                  )}
                </div>
                {rv.dataPrimeiraReuniao && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(rv.dataPrimeiraReuniao), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                )}
              </div>

              {/* Datas de acompanhamento */}
              <div className="space-y-2">
                <Label>Datas de Acompanhamento Planejadas</Label>
                {rv.datasAcompanhamento.length > 0 ? (
                  <ul className="space-y-1">
                    {rv.datasAcompanhamento.map((d, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm bg-muted border rounded px-3 py-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {format(new Date(d), 'dd/MM/yyyy', { locale: ptBR })}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Nenhuma data planejada ainda.</p>
                )}
                {canEdit && (
                  <div className="flex gap-2 pt-1">
                    <Input
                      type="date"
                      value={novaDataAcomp}
                      onChange={(e) => setNovaDataAcomp(e.target.value)}
                    />
                    <Button onClick={adicionarData} disabled={!novaDataAcomp || planejamentoMutation.isPending}
                      variant="outline" className="gap-1">
                      <Plus className="w-4 h-4" /> Adicionar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ABA: ACOMPANHAMENTOS */}
          <TabsContent value="acompanhamentos">
            <div className="space-y-4">
              {/* Form nova reunião */}
              {canEdit && (
                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                  <h3 className="font-semibold text-foreground">Registrar Reunião Realizada</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Data da Reunião *</Label>
                      <Input type="date" value={dataReuniao} onChange={(e) => setDataReuniao(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Ata (texto ou link)</Label>
                    <Textarea placeholder="Cole o link da ata ou escreva o conteúdo..." value={ata}
                      onChange={(e) => setAta(e.target.value)} className="min-h-[80px]" />
                  </div>
                  <div className="space-y-1">
                    <Label>Observações</Label>
                    <Textarea placeholder="Pontos relevantes da reunião..." value={observacao}
                      onChange={(e) => setObservacao(e.target.value)} className="min-h-[60px]" />
                  </div>
                  <Button onClick={() => acompanhamentoMutation.mutate()}
                    disabled={!dataReuniao || acompanhamentoMutation.isPending}
                    className="gradient-primary w-full">
                    {acompanhamentoMutation.isPending ? 'Salvando...' : 'Registrar Reunião'}
                  </Button>
                </div>
              )}

              {/* Lista de acompanhamentos */}
              {rv.acompanhamentos && rv.acompanhamentos.length > 0 ? (
                <div className="space-y-3">
                  {rv.acompanhamentos.map((ac) => (
                    <div key={ac.id} className="bg-card rounded-xl border border-border p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="w-4 h-4 text-primary" />
                          {format(new Date(ac.dataReuniao), "dd/MM/yyyy", { locale: ptBR })}
                          {ac.user?.profile?.fullName && (
                            <span className="text-muted-foreground font-normal">• {ac.user.profile.fullName}</span>
                          )}
                        </div>
                        {canEdit && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover acompanhamento?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => removeAcompMutation.mutate(ac.id)}>
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                      {ac.ata && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium text-muted-foreground">Ata: </span>
                          {ac.ata.startsWith('http') ? (
                            <a href={ac.ata} target="_blank" rel="noopener noreferrer"
                              className="text-primary hover:underline">Abrir link</a>
                          ) : (
                            <span className="whitespace-pre-wrap text-foreground">{ac.ata}</span>
                          )}
                        </div>
                      )}
                      {ac.observacao && (
                        <p className="mt-2 text-sm text-muted-foreground bg-muted rounded p-2 border">
                          {ac.observacao}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground italic">
                  Nenhuma reunião registrada ainda.
                </div>
              )}
            </div>
          </TabsContent>

          {/* ABA: HISTÓRICO */}
          <TabsContent value="historico">
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              {rv.history && rv.history.length > 0 ? (
                <div className="space-y-4">
                  {rv.history.map((h) => (
                    <div key={h.id} className="relative pl-4 border-l-2 border-border pb-2">
                      <div className="absolute w-2.5 h-2.5 bg-primary rounded-full -left-[6px] top-1.5 ring-4 ring-background" />
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-foreground">{h.action}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(h.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {h.user?.profile?.fullName && (
                        <p className="text-xs text-muted-foreground mb-1">Por: {h.user.profile.fullName}</p>
                      )}
                      {h.details && (
                        <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded border">
                          {h.details}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground italic py-8">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  Nenhum histórico ainda.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

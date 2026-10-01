import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  History,
  Plus,
  Trash2,
  Calendar,
  User,
  ArrowRight,
  Phone,
  Users,
  MessageSquare,
  Wrench,
  FileCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { criticalCaseService } from '@/services/criticalCaseService';
import {
  CriticalCaseAcompanhamento,
  CreateAcompanhamentoDto,
  CriticalCaseStatus,
  CRITICAL_CASE_STATUS_LABELS,
  CRITICAL_CASE_STATUS_COLORS,
} from '@/types/criticalCase';

const TIPO_OPTIONS = [
  { value: 'REUNIAO', label: 'Reunião com Cliente', icon: Users, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { value: 'CONTATO', label: 'Contato Telefônico', icon: Phone, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'MENSAGEM', label: 'WhatsApp / Mensagem', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'AJUSTE_TECNICO', label: 'Ajuste Técnico / Correção', icon: Wrench, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'ATUALIZACAO', label: 'Atualização Interna', icon: FileCheck, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'ACOMPANHAMENTO', label: 'Acompanhamento Geral', icon: Clock, color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

interface Props {
  criticalCaseId: string;
  canEdit?: boolean;
  onUpdate?: () => void;
}

export default function CriticalCaseTimeline({ criticalCaseId, canEdit = true, onUpdate }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState<CreateAcompanhamentoDto>({
    data: new Date().toISOString().slice(0, 10),
    tipo: 'ACOMPANHAMENTO',
    descricao: '',
    proximosPassos: '',
  });

  const { data: acompanhamentos = [], isLoading } = useQuery({
    queryKey: ['critical-case-acompanhamentos', criticalCaseId],
    queryFn: () => criticalCaseService.getAcompanhamentos(criticalCaseId),
    enabled: !!criticalCaseId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['critical-case-acompanhamentos', criticalCaseId] });
    queryClient.invalidateQueries({ queryKey: ['critical-case', criticalCaseId] });
    queryClient.invalidateQueries({ queryKey: ['critical-cases'] });
    if (onUpdate) onUpdate();
  };

  const addMutation = useMutation({
    mutationFn: (data: CreateAcompanhamentoDto) =>
      criticalCaseService.addAcompanhamento(criticalCaseId, data),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      setFormData({
        data: new Date().toISOString().slice(0, 10),
        tipo: 'ACOMPANHAMENTO',
        descricao: '',
        proximosPassos: '',
      });
      toast({ title: 'Evolução registrada!', description: 'Acompanhamento adicionado com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao registrar evolução.', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (acompanhamentoId: string) => criticalCaseService.deleteAcompanhamento(acompanhamentoId),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Removido', description: 'Acompanhamento excluído.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao excluir acompanhamento.', variant: 'destructive' });
    },
  });

  const getTipoInfo = (tipoVal: string) => {
    return TIPO_OPTIONS.find((t) => t.value === tipoVal) || {
      value: tipoVal,
      label: tipoVal,
      icon: Clock,
      color: 'text-slate-600 bg-slate-50 border-slate-200',
    };
  };

  return (
    <Card className="border shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Evolução e Acompanhamento do Caso ({acompanhamentos.length})
            </CardTitle>
            <CardDescription>
              Histórico cronológico de reuniões, alinhamentos, atendimentos e tratativas com o cliente.
            </CardDescription>
          </div>

          {canEdit && (
            <Button
              type="button"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-xs"
            >
              <Plus className="h-4 w-4" /> Nova Evolução
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Carregando histórico...</div>
        ) : acompanhamentos.length === 0 ? (
          <div className="py-8 text-center border border-dashed rounded-lg bg-muted/10">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-foreground">Nenhuma evolução registrada ainda</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Clique no botão "Nova Evolução" para registrar uma conversa, ata de reunião, contato ou ação tomada.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {acompanhamentos.map((item) => {
              const tipoInfo = getTipoInfo(item.tipo);
              const IconComponent = tipoInfo.icon;

              return (
                <div key={item.id} className="relative group">
                  {/* Ícone no eixo da timeline */}
                  <div className="absolute -left-[30px] top-1.5 h-6 w-6 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-xs">
                    <IconComponent className="h-3 w-3 text-primary" />
                  </div>

                  {/* Conteúdo do Card de Evolução */}
                  <div className="p-4 rounded-xl border bg-card/60 hover:bg-card transition-all space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold flex items-center gap-1.5 ${tipoInfo.color}`}>
                          <IconComponent className="h-3 w-3" />
                          {tipoInfo.label}
                        </span>

                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(item.data).toLocaleDateString('pt-BR')}
                        </span>

                        {item.user && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {item.user.profile?.fullName || item.user.email}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.statusNovo && (
                          <Badge className={`text-[11px] ${CRITICAL_CASE_STATUS_COLORS[item.statusNovo]}`}>
                            Status: {CRITICAL_CASE_STATUS_LABELS[item.statusNovo]}
                          </Badge>
                        )}

                        {canEdit && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                title="Excluir evolução"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir evolução?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação removerá este registro de acompanhamento permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => deleteMutation.mutate(item.id)}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>

                    {/* Descrição */}
                    <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {item.descricao}
                    </div>

                    {/* Próximos Passos decorrentes dessa evolução */}
                    {item.proximosPassos && (
                      <div className="pt-2 border-t border-border/50 text-xs flex items-start gap-1.5 text-primary font-medium bg-primary/5 p-2 rounded-md">
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Próximos Passos acordados: </span>
                          <span className="text-foreground/80 font-normal">{item.proximosPassos}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Modal para Registrar Nova Evolução */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Registrar Evolução e Acompanhamento
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formData.descricao.trim()) {
                toast({ title: 'Atenção', description: 'Preencha a descrição da evolução.', variant: 'destructive' });
                return;
              }
              addMutation.mutate(formData);
            }}
            className="space-y-4 pt-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Acompanhamento *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(val) => setFormData({ ...formData, tipo: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data do Ocorrido / Reunião *</Label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Descrição da Evolução / Ata / O que foi realizado *</Label>
              <Textarea
                placeholder="Descreva detalhadamente o contato realizado, pontos tratados, acordos firmados ou progresso técnico..."
                rows={4}
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="mt-1 leading-relaxed"
                required
              />
            </div>

            <div>
              <Label>Próximos Passos Decorrentes (Opcional)</Label>
              <Textarea
                placeholder="Ações que devem ser tomadas a partir desta evolução..."
                rows={2}
                value={formData.proximosPassos || ''}
                onChange={(e) => setFormData({ ...formData, proximosPassos: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Atualizar Status do Caso</Label>
              <Select
                value={formData.statusNovo || 'NO_CHANGE'}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    statusNovo: val === 'NO_CHANGE' ? undefined : (val as CriticalCaseStatus),
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Manter status atual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_CHANGE">Manter status atual do caso</SelectItem>
                  {Object.entries(CRITICAL_CASE_STATUS_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      Mudar para: {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={addMutation.isPending} className="bg-primary hover:bg-primary/90">
                {addMutation.isPending ? 'Salvando...' : 'Salvar Evolução'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

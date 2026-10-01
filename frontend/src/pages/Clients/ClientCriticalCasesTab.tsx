import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Plus, Pencil, Trash2, Eye, ExternalLink, ArrowRight, Users, Check, FileDown } from 'lucide-react';
import { generateSingleCriticalCasePDF } from '@/utils/criticalCasePdfGenerator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { usePermissions } from '@/hooks/usePermissions';
import { criticalCaseService } from '@/services/criticalCaseService';
import {
  CriticalCase,
  CRITICAL_CASE_CATEGORY_LABELS,
  CRITICAL_CASE_CATEGORY_COLORS,
  CRITICAL_CASE_STATUS_LABELS,
  CRITICAL_CASE_STATUS_COLORS,
} from '@/types/criticalCase';
import CriticalCaseTimeline from '../Support/CriticalCases/CriticalCaseTimeline';

interface Props {
  clientId: string;
}

export default function ClientCriticalCasesTab({ clientId }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canEdit } = usePermissions('/clients');

  const [selectedCaseDetail, setSelectedCaseDetail] = useState<CriticalCase | null>(null);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['critical-cases-client', clientId],
    queryFn: () => criticalCaseService.findByClient(clientId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['critical-cases-client', clientId] });
    queryClient.invalidateQueries({ queryKey: ['critical-cases'] });
  };

  const deleteMutation = useMutation({
    mutationFn: criticalCaseService.delete,
    onSuccess: () => {
      invalidate();
      toast({ title: 'Excluído', description: 'Caso crítico removido.' });
    },
    onError: () => toast({ title: 'Erro', description: 'Falha ao excluir caso crítico.', variant: 'destructive' }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Casos Críticos e Alinhamentos ({cases.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Histórico de ocorrências, alinhamentos estratégicos, queixas e próximos passos deste cliente.
          </p>
        </div>
        {canEdit && (
          <Button
            size="sm"
            onClick={() => navigate('/support/critical-cases/new')}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Novo Caso Crítico
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground text-sm">Carregando casos críticos...</div>
      ) : cases.length === 0 ? (
        <div className="py-10 text-center border rounded-lg bg-muted/10">
          <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium">Nenhum caso crítico registrado para este cliente</p>
          <p className="text-xs text-muted-foreground mt-1">
            Utilize o botão acima para registrar um alinhamento ou ocorrência.
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Categorias</TableHead>
                <TableHead>Participantes / OBS</TableHead>
                <TableHead>Próximos Passos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge className={CRITICAL_CASE_STATUS_COLORS[item.status]}>
                      {CRITICAL_CASE_STATUS_LABELS[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {item.categories.map((cat) => (
                        <span
                          key={cat}
                          className={`text-xs px-2 py-0.5 rounded border font-medium ${CRITICAL_CASE_CATEGORY_COLORS[cat] || 'bg-muted'}`}
                        >
                          {CRITICAL_CASE_CATEGORY_LABELS[cat]}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    {item.participantes && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                        <Users className="h-3 w-3 inline shrink-0" />
                        <span className="truncate">{item.participantes}</span>
                      </p>
                    )}
                    {item.observacoes && (
                      <p className="text-xs text-foreground/80 line-clamp-2 mt-0.5">
                        {item.observacoes}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    {item.proximosPassos ? (
                      <p className="text-xs text-foreground/90 line-clamp-2">
                        {item.proximosPassos}
                      </p>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => generateSingleCriticalCasePDF(item)}
                        title="Baixar Dossiê PDF"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setSelectedCaseDetail(item)}
                        title="Ver Detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => navigate(`/support/critical-cases/${item.id}`)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {canEdit && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Caso Crítico?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação removerá este caso crítico permanentemente.
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedCaseDetail} onOpenChange={(open) => !open && setSelectedCaseDetail(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex justify-between items-center pr-6">
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Detalhes do Caso Crítico
              </DialogTitle>
              {selectedCaseDetail && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-primary border-primary/40 hover:bg-primary/10"
                  onClick={() => generateSingleCriticalCasePDF(selectedCaseDetail)}
                >
                  <FileDown className="h-3.5 w-3.5" />
                  PDF
                </Button>
              )}
            </div>
          </DialogHeader>

          {selectedCaseDetail && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <div className="flex flex-wrap gap-1">
                  {selectedCaseDetail.categories.map((cat) => (
                    <Badge key={cat} variant="outline" className={CRITICAL_CASE_CATEGORY_COLORS[cat]}>
                      {CRITICAL_CASE_CATEGORY_LABELS[cat]}
                    </Badge>
                  ))}
                </div>
                <Badge className={CRITICAL_CASE_STATUS_COLORS[selectedCaseDetail.status]}>
                  {CRITICAL_CASE_STATUS_LABELS[selectedCaseDetail.status]}
                </Badge>
              </div>

              {selectedCaseDetail.participantes && (
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Participantes:</span>
                  <p className="text-sm mt-0.5 bg-muted/20 p-2 rounded border">
                    {selectedCaseDetail.participantes}
                  </p>
                </div>
              )}

              {selectedCaseDetail.observacoes && (
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase">OBS (Histórico):</span>
                  <div className="text-sm mt-0.5 bg-muted/20 p-2.5 rounded border whitespace-pre-wrap leading-relaxed">
                    {selectedCaseDetail.observacoes}
                  </div>
                </div>
              )}

              {selectedCaseDetail.proximosPassos && (
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Próximos Passos:</span>
                  <div className="text-sm mt-0.5 bg-primary/5 p-2.5 rounded border border-primary/20 whitespace-pre-wrap leading-relaxed">
                    {selectedCaseDetail.proximosPassos}
                  </div>
                </div>
              )}

              {/* Linha do Tempo e Histórico de Evoluções */}
              <div className="pt-2">
                <CriticalCaseTimeline
                  criticalCaseId={selectedCaseDetail.id}
                  onUpdate={() => invalidate()}
                />
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t">
                Registrado em: {new Date(selectedCaseDetail.createdAt).toLocaleString('pt-BR')}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

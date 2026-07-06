import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AssessmentData } from '@/types/assessment';
import { AssessmentForm } from '@/components/assessment/AssessmentForm';
import { assessmentService } from '@/services/assessmentService';
import { clientService } from '@/services/clientService';
import { downloadPDF, downloadValidationPDF } from '@/utils/pdfGenerator';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PorteBadge } from '@/components/assessment/PorteBadge';
import { calculatePorte, getOverallStatus, validateAssessment } from '@/utils/validation';
import { Plus, FileText, Trash2, ChevronRight, Download, CheckCircle2, Clock, BarChart3, History } from 'lucide-react';
import { NewAssessmentDialog } from '@/components/assessment/NewAssessmentDialog';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Building2, Server, Monitor } from 'lucide-react';

export default function Index() {
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentData | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { canEdit } = usePermissions('/assessments');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadAssessments();
      checkQueryParams();
    }
  }, [user]);

  const checkQueryParams = async () => {
    const clientId = searchParams.get('clientId');
    const create = searchParams.get('create');

    if (clientId && create === 'true') {
      try {
        // Clear params to avoid re-triggering on refresh
        setSearchParams({}, { replace: true });

        // Fetch client details to pre-fill
        const client = await clientService.findOne(clientId);
        if (client) {
          handleNewWithClient(client);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do cliente para nova validação', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do cliente.",
          variant: "destructive",
        });
      }
    }
  };

  const loadAssessments = async () => {
    try {
      const data = await assessmentService.findAll();
      setAssessments(data);
    } catch (error) {
      console.error('Erro ao carregar assessments', error);
    }
  };

  // handleNew has been removed in favor of handleNewWithClient via NewAssessmentDialog

  const handleNewWithClient = async (client: any) => {
    try {
      const data = await assessmentService.create({
        clientId: client.id,
        status: 'rascunho',
        company: {
          nomeFantasia: client.nomeFantasia,
          cnpj: client.cnpj,
          lojaNumero: 1,
          lojaTotalLojas: 1,
          contatoNome: client.contatoNome || '',
          contatoEmail: client.contatoEmail || '',
          contatoCelular: client.contatoCelular || '',
        },
        // Also provide these at top level for the service fallback
        companyName: client.nomeFantasia,
        cnpj: client.cnpj
      });
      setCurrentAssessment(data);
      loadAssessments();
    } catch (error) {
      console.error('Erro ao criar assessment para cliente', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a validação para este cliente.",
        variant: "destructive",
      });
    }
  };

  const handleSelect = async (assessment: AssessmentData) => {
    try {
      const fullAssessment = await assessmentService.findOne(assessment.id);
      setCurrentAssessment(fullAssessment);
    } catch (error) {
      console.error('Erro ao carregar os detalhes da validação', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes da validação.",
        variant: "destructive",
      });
      setCurrentAssessment(assessment);
    }
  };

  const loadHistory = async () => {
    if (!currentAssessment) return;
    setHistoryLoading(true);
    try {
      const data = await assessmentService.getHistory(currentAssessment.id);
      setHistoryData(data);
    } catch (error) {
      console.error('Erro ao carregar histórico', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico.",
        variant: "destructive",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (historyOpen && currentAssessment) {
      loadHistory();
    }
  }, [historyOpen]);

  const handleDelete = async (id: string) => {
    try {
      await assessmentService.delete(id);
      loadAssessments();
    } catch (error) {
      console.error('Erro ao excluir assessment', error);
    }
  };

  const handleBack = async () => {
    if (currentAssessment) {
      try {
        await assessmentService.update(currentAssessment.id, currentAssessment);
      } catch (error) {
        console.error('Erro ao salvar assessment', error);
      }
    }
    loadAssessments();
    setCurrentAssessment(null);
  };

  const handleDownloadPDF = async () => {
    if (currentAssessment) {
      try {
        const report = await assessmentService.validate(currentAssessment.id);
        await downloadPDF(currentAssessment, report);
      } catch (error) {
        console.error('Erro ao gerar PDF com adequação', error);
        // Fallback to simple PDF if report fails
        downloadPDF(currentAssessment);
      }
    }
  };

  const handleDownloadValidationPDF = async () => {
    if (currentAssessment) {
      await downloadValidationPDF(currentAssessment);
      toast({
        title: "PDF gerado com sucesso!",
        description: "O PDF de validação foi exportado.",
      });
    }
  };

  const columns: ColumnDef<AssessmentData>[] = [
    {
      id: "company_nomeFantasia",
      accessorKey: "company.nomeFantasia",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent -ml-4"
          >
            Empresa
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold">{row.original.company.nomeFantasia || 'Sem nome'}</span>
          <span className="text-xs text-muted-foreground">{row.original.company.cnpj || 'CNPJ não informado'}</span>
        </div>
      ),
    },
    {
      accessorKey: "porte",
      header: "Porte",
      cell: ({ row }) => <PorteBadge porte={calculatePorte(row.original)} />,
    },
    {
      id: "infra",
      header: "Infraestrutura",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Server className="w-3 h-3" />
            {row.original.servers.length}
          </div>
          <div className="flex items-center gap-1">
            <Monitor className="w-3 h-3" />
            {row.original.pdvs.length}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const val = String(row.getValue("status")).toLowerCase();
        const colors: Record<string, string> = {
          'adequado': 'bg-green-100 text-green-700 border-green-200',
          'atenção': 'bg-yellow-100 text-yellow-700 border-yellow-200',
          'incompatível': 'bg-red-100 text-red-700 border-red-200',
          'rascunho': 'bg-gray-100 text-gray-600 border-gray-200',
        };

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${colors[val] || 'bg-yellow-100 text-yellow-700'}`}>
            {String(row.getValue("status"))}
          </span>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent -ml-4"
          >
            Última Atualização
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => new Date(row.getValue("updatedAt")).toLocaleDateString('pt-BR'),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const assessment = row.original;
        return (
          <div className="text-right flex items-center justify-end gap-2">
            {canEdit && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={e => e.stopPropagation()}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={e => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir assessment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Todos os dados serão perdidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={e => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(assessment.id);
                      }}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleSelect(assessment)}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )
      },
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (currentAssessment) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBack}>
              ← Voltar
            </Button>
            <div>
              <h1 className="font-display text-xl font-bold">
                {currentAssessment.company.nomeFantasia || 'Nova Validação'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Loja {currentAssessment.company.lojaNumero} de {currentAssessment.company.lojaTotalLojas}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={() => setHistoryOpen(true)}>
              <History className="w-4 h-4" />
              Histórico
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Exportar PDF
                  <ChevronRight className="w-3 h-3 ml-1 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleDownloadValidationPDF} className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  <div className="flex flex-col">
                    <span className="font-medium">Validação Completa</span>
                    <span className="text-xs text-muted-foreground">Todos os dados coletados</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  <div className="flex flex-col">
                    <span className="font-medium">Relatório de Adequação</span>
                    <span className="text-xs text-muted-foreground">Análise técnica comparativa</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <PorteBadge porte={calculatePorte(currentAssessment)} />
            {currentAssessment.company.lojaTotalLojas > 1 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Multi-Lojas
              </span>
            )}
          </div>
        </div>

        <AssessmentForm
          data={currentAssessment}
          onChange={setCurrentAssessment}
        />

        {/* Modal de Histórico */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Histórico de Alterações
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : historyData && historyData.length > 0 ? (
                historyData.map((hist: any) => (
                  <div key={hist.id} className="flex gap-4 p-3 border rounded-lg bg-card text-sm">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">{hist.action}</p>
                        <span className="text-muted-foreground text-xs">
                          {new Date(hist.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-muted-foreground">
                        Por: {hist.user?.profile?.fullName || hist.user?.email || 'Sistema'}
                      </p>

                      {hist.details && (
                        <div className="mt-2 text-xs bg-muted/50 p-2 rounded-md space-y-1">
                          {(() => {
                            try {
                              const parsed = JSON.parse(hist.details);
                              return Object.entries(parsed).map(([campo, val]: [string, any]) => (
                                <div key={campo} className="flex flex-wrap gap-1">
                                  <span className="font-semibold text-foreground">{campo}:</span>
                                  <span className="text-red-500 line-through">{typeof val.de === 'object' ? JSON.stringify(val.de) : String(val.de ?? '(vazio)')}</span>
                                  <span className="text-muted-foreground">→</span>
                                  <span className="text-green-600">{typeof val.para === 'object' ? JSON.stringify(val.para) : String(val.para ?? '(vazio)')}</span>
                                </div>
                              ));
                            } catch (e) {
                              return <span className="text-muted-foreground font-mono break-all">{hist.details}</span>;
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum histórico registrado.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Validações de Infraestrutura
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciamento de validações técnicas e assessments
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && <NewAssessmentDialog onCreateWithClient={handleNewWithClient} />}
        </div>
      </div>

      {/* Resumo das Validações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total de Validações</p>
                <h3 className="text-3xl font-bold">{assessments.length}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {assessments.filter(a => {
                    const date = new Date(a.updatedAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return date >= weekAgo;
                  }).length} nos últimos 7 dias
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Em Análise</p>
                <h3 className="text-3xl font-bold">
                  {assessments.filter(a => a.status === 'rascunho' || a.status === 'em_analise').length}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Aguardando conclusão
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Distribuição por Porte</p>
                <div className="flex gap-2 mt-2">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Pequeno</p>
                    <p className="text-lg font-bold">
                      {assessments.filter(a => calculatePorte(a) === 'pequeno').length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Médio</p>
                    <p className="text-lg font-bold">
                      {assessments.filter(a => calculatePorte(a) === 'medio').length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Grande</p>
                    <p className="text-lg font-bold">
                      {assessments.filter(a => calculatePorte(a) === 'grande').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Validações */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-bold">Todas as Validações</h2>
        </div>

        {assessments.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">
                Nenhuma validação encontrada
              </h3>
              <p className="text-muted-foreground mb-6">
                {canEdit ? 'Crie uma nova validação para começar a coletar dados.' : 'Nenhuma validação registrada.'}
              </p>
              {canEdit && (
                <NewAssessmentDialog onCreateWithClient={handleNewWithClient}>
                  <Button className="gradient-primary text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Validação
                  </Button>
                </NewAssessmentDialog>
              )}
            </CardContent>
          </Card>
        ) : (
      <Card className="glass-card">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={assessments}
            searchKey="company_nomeFantasia"
            filename="validacoes-itmizer"
          />
        </CardContent>
      </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

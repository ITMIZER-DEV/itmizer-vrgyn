import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Plus,
  Search,
  Building2,
  FolderOpen,
  KeyRound,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  Users,
  Clock,
  CheckCircle2,
  ListFilter,
  Layers,
  ArrowRight,
  FileDown,
  FileText,
  Calendar,
  Check,
} from 'lucide-react';
import {
  generateSingleCriticalCasePDF,
  generateCriticalCasesReportPDF,
  ReportFilters,
} from '@/utils/criticalCasePdfGenerator';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
import { clientService } from '@/services/clientService';
import { clientCredentialService } from '@/services/clientCredentialService';
import CriticalCaseTimeline from './CriticalCaseTimeline';
import {
  CriticalCase,
  CriticalCaseCategory,
  CriticalCaseStatus,
  CRITICAL_CASE_CATEGORY_LABELS,
  CRITICAL_CASE_CATEGORY_COLORS,
  CRITICAL_CASE_STATUS_LABELS,
  CRITICAL_CASE_STATUS_COLORS,
} from '@/types/criticalCase';
import { ClientCredential, CLIENT_CREDENTIAL_TYPE_LABELS } from '@/types/clientCredential';

export default function CriticalCasesList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canEdit } = usePermissions('/support/critical-cases');

  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [groupByClient, setGroupByClient] = useState(false);

  // Modal para visualização rápida de credenciais de um cliente
  const [credentialsModalClient, setCredentialsModalClient] = useState<{
    id: string;
    nomeFantasia: string;
  } | null>(null);

  // Modal para detalhe completo do caso crítico
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<CriticalCase | null>(null);

  // Modal para Relatório PDF por Período
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportClientId, setReportClientId] = useState('all');
  const [reportStatus, setReportStatus] = useState('all');
  const [reportIncludeEvolucoes, setReportIncludeEvolucoes] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list-filter'],
    queryFn: () => clientService.findAll(),
  });

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['critical-cases', search, selectedClientId, selectedStatus, selectedCategory],
    queryFn: () =>
      criticalCaseService.findAll({
        clientId: selectedClientId !== 'all' ? selectedClientId : undefined,
        status: selectedStatus !== 'all' ? (selectedStatus as CriticalCaseStatus) : undefined,
        category: selectedCategory !== 'all' ? (selectedCategory as CriticalCaseCategory) : undefined,
        search: search || undefined,
      }),
  });

  // Carrega credenciais do cliente para o modal rápido
  const { data: clientCredentials = [], isLoading: isLoadingCredentials } = useQuery({
    queryKey: ['modal-client-credentials', credentialsModalClient?.id],
    queryFn: () => clientCredentialService.findByClient(credentialsModalClient!.id),
    enabled: !!credentialsModalClient?.id,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['critical-cases'] });

  const deleteMutation = useMutation({
    mutationFn: criticalCaseService.delete,
    onSuccess: () => {
      invalidate();
      toast({ title: 'Excluído', description: 'Caso crítico removido com sucesso.' });
    },
    onError: () =>
      toast({ title: 'Erro', description: 'Falha ao excluir o caso crítico.', variant: 'destructive' }),
  });

  const totalCount = cases.length;
  const abertosCount = cases.filter((c) => c.status === 'ABERTO').length;
  const emAndamentoCount = cases.filter((c) => c.status === 'EM_ANDAMENTO').length;
  const resolvidosCount = cases.filter((c) => c.status === 'RESOLVIDO').length;

  // Agrupamento por cliente se habilitado
  const groupedCases = cases.reduce<Record<string, { client: CriticalCase['client']; cases: CriticalCase[] }>>(
    (acc, item) => {
      const cId = item.clientId;
      if (!acc[cId]) {
        acc[cId] = {
          client: item.client,
          cases: [],
        };
      }
      acc[cId].cases.push(item);
      return acc;
    },
    {}
  );

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      // Busca casos com os filtros definidos no modal
      const data = await criticalCaseService.findAll({
        clientId: reportClientId !== 'all' ? reportClientId : undefined,
        status: reportStatus !== 'all' ? (reportStatus as CriticalCaseStatus) : undefined,
      });

      // Filtra por data localmente se fornecido
      let filtered = data;
      if (reportStartDate) {
        const start = new Date(reportStartDate).getTime();
        filtered = filtered.filter((c) => new Date(c.createdAt).getTime() >= start);
      }
      if (reportEndDate) {
        const end = new Date(reportEndDate).setHours(23, 59, 59, 999);
        filtered = filtered.filter((c) => new Date(c.createdAt).getTime() <= end);
      }

      const clientObj = clients.find((c) => c.id === reportClientId);
      const filters: ReportFilters = {
        startDate: reportStartDate || undefined,
        endDate: reportEndDate || undefined,
        clientName: clientObj?.nomeFantasia,
        statusLabel: reportStatus !== 'all' ? CRITICAL_CASE_STATUS_LABELS[reportStatus as CriticalCaseStatus] : undefined,
        includeEvolucoes: reportIncludeEvolucoes,
      };

      generateCriticalCasesReportPDF(filtered, filters);
      toast({
        title: 'Relatório Gerado',
        description: `Relatório exportado com sucesso contendo ${filtered.length} caso(s).`,
      });
      setReportModalOpen(false);
    } catch (err) {
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Não foi possível gerar o PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              Casos Críticos de Suporte
            </h1>
            <p className="text-sm text-muted-foreground">
              Acompanhamento centralizado de ocorrências críticas, alinhamentos, reuniões e planos de ação por cliente.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10"
            >
              <FileDown className="h-4 w-4" />
              Relatório PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => setGroupByClient(!groupByClient)}
              className="flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              {groupByClient ? 'Visão Lista' : 'Agrupar por Cliente'}
            </Button>
            <Button
              onClick={() => navigate('/support/critical-cases/new')}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Novo Caso Crítico
            </Button>
          </div>
        </div>

        {/* Indicadores / Cards de Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setSelectedStatus('all')}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total de Casos</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <Layers className="h-8 w-8 text-muted-foreground/30" />
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-colors ${selectedStatus === 'ABERTO' ? 'ring-2 ring-amber-500' : 'hover:border-amber-500/50'}`}
            onClick={() => setSelectedStatus(selectedStatus === 'ABERTO' ? 'all' : 'ABERTO')}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Abertos</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{abertosCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500/30" />
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-colors ${selectedStatus === 'EM_ANDAMENTO' ? 'ring-2 ring-blue-500' : 'hover:border-blue-500/50'}`}
            onClick={() => setSelectedStatus(selectedStatus === 'EM_ANDAMENTO' ? 'all' : 'EM_ANDAMENTO')}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Em Andamento</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{emAndamentoCount}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500/30" />
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-colors ${selectedStatus === 'RESOLVIDO' ? 'ring-2 ring-emerald-500' : 'hover:border-emerald-500/50'}`}
            onClick={() => setSelectedStatus(selectedStatus === 'RESOLVIDO' ? 'all' : 'RESOLVIDO')}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Resolvidos</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{resolvidosCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar em observações, participantes, cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Filtrar por Cliente" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Clientes</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nomeFantasia} ({c.cnpj})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <ListFilter className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Filtrar por Categoria" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {Object.entries(CRITICAL_CASE_CATEGORY_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    {Object.entries(CRITICAL_CASE_STATUS_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visualização Agrupada por Cliente */}
        {groupByClient ? (
          <div className="space-y-4">
            {Object.keys(groupedCases).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="font-medium">Nenhum caso crítico encontrado</p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedCases).map(([cId, group]) => (
                <Card key={cId} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3 bg-muted/20">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-primary" />
                        <div>
                          <Link
                            to={`/clients/${cId}`}
                            className="text-lg font-bold hover:underline flex items-center gap-1.5"
                          >
                            {group.client?.nomeFantasia || 'Cliente'}
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </Link>
                          <span className="text-xs text-muted-foreground">CNPJ: {group.client?.cnpj}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {group.client?.driveLink && (
                          <a
                            href={group.client.driveLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 rounded border border-blue-200"
                          >
                            <FolderOpen className="h-3.5 w-3.5" /> Google Drive
                          </a>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() =>
                            setCredentialsModalClient({
                              id: cId,
                              nomeFantasia: group.client?.nomeFantasia || 'Cliente',
                            })
                          }
                        >
                          <KeyRound className="h-3.5 w-3.5 text-primary" />
                          Dados de Acesso
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="space-y-3">
                      {group.cases.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-lg border bg-card hover:bg-muted/10 transition-colors flex flex-col md:flex-row justify-between gap-3 items-start md:items-center"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge className={CRITICAL_CASE_STATUS_COLORS[item.status]}>
                                {CRITICAL_CASE_STATUS_LABELS[item.status]}
                              </Badge>
                              {item.categories.map((cat) => (
                                <span
                                  key={cat}
                                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CRITICAL_CASE_CATEGORY_COLORS[cat] || 'bg-muted'}`}
                                >
                                  {CRITICAL_CASE_CATEGORY_LABELS[cat]}
                                </span>
                              ))}
                              <span className="text-xs text-muted-foreground ml-1">
                                {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>

                            {item.observacoes && (
                              <p className="text-sm line-clamp-2 text-foreground/90 font-normal">
                                {item.observacoes}
                              </p>
                            )}

                            {item.proximosPassos && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                                <span className="font-semibold text-foreground/80">Próximos passos:</span>
                                <span className="line-clamp-1">{item.proximosPassos}</span>
                              </div>
                            )}

                            {item.participantes && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3 shrink-0" />
                                <span>{item.participantes}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0 self-end md:self-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => generateSingleCriticalCasePDF(item)}
                              title="Baixar Dossiê PDF deste Caso"
                            >
                              <FileDown className="h-3.5 w-3.5" /> PDF
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs gap-1"
                              onClick={() => setSelectedCaseDetail(item)}
                            >
                              <Eye className="h-3.5 w-3.5" /> Detalhes
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1"
                              onClick={() => navigate(`/support/critical-cases/${item.id}`)}
                            >
                              <Edit2 className="h-3.5 w-3.5" /> Editar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Visualização em Tabela Completa */
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-semibold">Lista de Casos Críticos</CardTitle>
                  <CardDescription>{cases.length} caso(s) registrado(s)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-10 text-muted-foreground">Carregando casos críticos...</div>
              ) : cases.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="font-medium">Nenhum caso crítico registrado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Utilize o botão "Novo Caso Crítico" para registrar um alinhamento ou ocorrência.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Categorias (Tipo)</TableHead>
                        <TableHead>Participantes / OBS</TableHead>
                        <TableHead>Próximos Passos</TableHead>
                        <TableHead>Acessos / Drive</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cases.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.client ? (
                              <Link
                                to={`/clients/${item.client.id}`}
                                className="text-primary hover:underline font-semibold block"
                              >
                                {item.client.nomeFantasia}
                              </Link>
                            ) : (
                              '—'
                            )}
                            <span className="text-xs text-muted-foreground">{item.client?.cnpj}</span>
                          </TableCell>

                          <TableCell>
                            <Badge className={CRITICAL_CASE_STATUS_COLORS[item.status]}>
                              {CRITICAL_CASE_STATUS_LABELS[item.status]}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
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

                          <TableCell className="max-w-[240px]">
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
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.client?.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs px-2 gap-1"
                                  onClick={() =>
                                    setCredentialsModalClient({
                                      id: item.client!.id,
                                      nomeFantasia: item.client!.nomeFantasia,
                                    })
                                  }
                                  title="Ver Dados de Acesso"
                                >
                                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                                  Acessos
                                </Button>
                              )}

                              {item.client?.driveLink && (
                                <a
                                  href={item.client.driveLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Abrir Google Drive do Cliente"
                                >
                                  <FolderOpen className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
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
                                <Edit2 className="h-4 w-4" />
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
                                        Esta ação removerá este caso crítico permanentemente do sistema.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive hover:bg-destructive/90"
                                        onClick={() => deleteMutation.mutate(item.id)}
                                      >
                                        Confirmar Exclusão
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
            </CardContent>
          </Card>
        )}

        {/* Modal de Detalhes do Caso Crítico */}
        <Dialog open={!!selectedCaseDetail} onOpenChange={(open) => !open && setSelectedCaseDetail(null)}>
          <DialogContent className="max-w-2xl">
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
                    Exportar Dossiê PDF
                  </Button>
                )}
              </div>
            </DialogHeader>

            {selectedCaseDetail && (
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center p-3 bg-muted/40 rounded-lg">
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      {selectedCaseDetail.client?.nomeFantasia}
                    </h3>
                    <p className="text-xs text-muted-foreground">CNPJ: {selectedCaseDetail.client?.cnpj}</p>
                  </div>
                  <Badge className={CRITICAL_CASE_STATUS_COLORS[selectedCaseDetail.status]}>
                    {CRITICAL_CASE_STATUS_LABELS[selectedCaseDetail.status]}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Categorias do Caso
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCaseDetail.categories.map((cat) => (
                      <Badge
                        key={cat}
                        variant="outline"
                        className={`text-xs px-2.5 py-1 ${CRITICAL_CASE_CATEGORY_COLORS[cat]}`}
                      >
                        {CRITICAL_CASE_CATEGORY_LABELS[cat]}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedCaseDetail.participantes && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Participantes
                    </h4>
                    <p className="text-sm bg-muted/20 p-2.5 rounded border">
                      {selectedCaseDetail.participantes}
                    </p>
                  </div>
                )}

                {selectedCaseDetail.observacoes && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      OBS (Observações e Histórico)
                    </h4>
                    <div className="text-sm bg-muted/20 p-3 rounded border whitespace-pre-wrap leading-relaxed">
                      {selectedCaseDetail.observacoes}
                    </div>
                  </div>
                )}

                {selectedCaseDetail.proximosPassos && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Próximos Passos
                    </h4>
                    <div className="text-sm bg-primary/5 p-3 rounded border border-primary/20 text-foreground whitespace-pre-wrap leading-relaxed">
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

                <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                  <span>
                    Criado em: {new Date(selectedCaseDetail.createdAt).toLocaleString('pt-BR')}
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedCaseDetail.client?.driveLink && (
                      <a
                        href={selectedCaseDetail.client.driveLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        <FolderOpen className="h-3.5 w-3.5" /> Google Drive do Cliente
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Relatório por Período */}
        <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileDown className="h-5 w-5 text-primary" />
                Exportar Relatório em PDF
              </DialogTitle>
              <DialogDescription>
                Gere um relatório consolidado com casos críticos e histórico de evoluções por período.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="start-date" className="text-xs font-semibold">
                    Data Inicial
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="end-date" className="text-xs font-semibold">
                    Data Final
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Filtrar por Cliente</Label>
                <Select value={reportClientId} onValueChange={setReportClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os Clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Clientes</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nomeFantasia} ({c.cnpj})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Filtrar por Status</Label>
                <Select value={reportStatus} onValueChange={setReportStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    {Object.entries(CRITICAL_CASE_STATUS_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 border-t">
                <div
                  className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 cursor-pointer select-none hover:bg-muted/30"
                  onClick={() => setReportIncludeEvolucoes(!reportIncludeEvolucoes)}
                >
                  <div
                    className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                      reportIncludeEvolucoes
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/40 bg-background'
                    }`}
                  >
                    {reportIncludeEvolucoes && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">
                      Incluir Registro Detalhado de Evoluções e Acompanhamentos
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Gera uma seção adicional contendo a ata completa de reuniões, alinhamentos e atendimentos realizados no período.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setReportModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <FileDown className="h-4 w-4" />
                {isGeneratingReport ? 'Gerando...' : 'Baixar Relatório PDF'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Rápido de Dados de Acesso do Cliente */}
        <Dialog
          open={!!credentialsModalClient}
          onOpenChange={(open) => !open && setCredentialsModalClient(null)}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Dados de Acesso - {credentialsModalClient?.nomeFantasia}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              {isLoadingCredentials ? (
                <div className="text-center py-6 text-muted-foreground">Carregando acessos...</div>
              ) : clientCredentials.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Nenhum dado de acesso cadastrado para este cliente no Vault.
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {clientCredentials.map((cred) => (
                    <div
                      key={cred.id}
                      className="p-3 rounded-lg border bg-muted/10 flex justify-between items-center gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{cred.label}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {CLIENT_CREDENTIAL_TYPE_LABELS[cred.type]}
                          </Badge>
                        </div>
                        {cred.username && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            ID/Usuário: <code className="font-mono bg-muted px-1 rounded">{cred.username}</code>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={async () => {
                          try {
                            const secret = await clientCredentialService.copy(cred.id);
                            const text = cred.username
                              ? `Usuário: ${cred.username}\nSenha: ${secret}`
                              : `Senha: ${secret}`;
                            await navigator.clipboard.writeText(text);
                            toast({ title: 'Copiado', description: 'Credencial copiada!' });
                          } catch {
                            toast({ title: 'Erro', description: 'Falha ao copiar senha.', variant: 'destructive' });
                          }
                        }}
                      >
                        Copiar Acesso
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

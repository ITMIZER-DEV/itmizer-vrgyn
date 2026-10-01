import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  Building2,
  FolderOpen,
  KeyRound,
  Users,
  FileText,
  Check,
  ChevronsUpDown,
  ExternalLink,
  Copy,
  Layers,
  FileDown,
} from 'lucide-react';
import { generateSingleCriticalCasePDF } from '@/utils/criticalCasePdfGenerator';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { criticalCaseService } from '@/services/criticalCaseService';
import { clientService } from '@/services/clientService';
import { clientCredentialService } from '@/services/clientCredentialService';
import {
  CreateCriticalCaseDto,
  CriticalCaseCategory,
  CriticalCaseStatus,
  CRITICAL_CASE_CATEGORY_LABELS,
  CRITICAL_CASE_STATUS_LABELS,
} from '@/types/criticalCase';
import CriticalCaseTimeline from './CriticalCaseTimeline';

const CATEGORIES: CriticalCaseCategory[] = [
  'ALINHAMENTO',
  'CHAMADO',
  'REUNIAO',
  'RECLAMACAO',
  'TREINAMENTO',
  'LEVANTAMENTOS',
  'PROJETOS',
  'INFORMATIVO',
];

const STATUS_OPTIONS: CriticalCaseStatus[] = [
  'ABERTO',
  'EM_ANDAMENTO',
  'RESOLVIDO',
  'CANCELADO',
];

export default function CriticalCaseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [clientOpen, setClientOpen] = useState(false);
  const [form, setForm] = useState<CreateCriticalCaseDto>({
    clientId: '',
    status: 'ABERTO',
    categories: [],
    participantes: '',
    observacoes: '',
    proximosPassos: '',
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-critical-cases'],
    queryFn: () => clientService.findAll(),
  });

  const { data: existingCase, isLoading: isLoadingCase } = useQuery({
    queryKey: ['critical-case', id],
    queryFn: () => criticalCaseService.findOne(id!),
    enabled: isEditing,
  });

  // Dados do cliente selecionado
  const selectedClient = clients.find((c) => c.id === form.clientId) || existingCase?.client;

  // Credenciais do cliente selecionado
  const { data: clientCredentials = [] } = useQuery({
    queryKey: ['client-credentials-preview', form.clientId],
    queryFn: () => clientCredentialService.findByClient(form.clientId),
    enabled: !!form.clientId,
  });

  useEffect(() => {
    if (existingCase) {
      setForm({
        clientId: existingCase.clientId,
        status: existingCase.status,
        categories: existingCase.categories || [],
        participantes: existingCase.participantes || '',
        observacoes: existingCase.observacoes || '',
        proximosPassos: existingCase.proximosPassos || '',
      });
    }
  }, [existingCase]);

  const toggleCategory = (cat: CriticalCaseCategory) => {
    const current = form.categories || [];
    const next = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat];
    setForm((prev) => ({ ...prev, categories: next }));
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateCriticalCaseDto) => criticalCaseService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['critical-cases'] });
      toast({ title: 'Sucesso', description: 'Caso crítico registrado com sucesso.' });
      navigate('/support/critical-cases');
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao salvar o caso crítico.', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateCriticalCaseDto) => criticalCaseService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['critical-cases'] });
      queryClient.invalidateQueries({ queryKey: ['critical-case', id] });
      toast({ title: 'Atualizado', description: 'Caso crítico atualizado com sucesso.' });
      navigate('/support/critical-cases');
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao atualizar o caso crítico.', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId) {
      toast({ title: 'Atenção', description: 'Por favor, selecione o cliente.', variant: 'destructive' });
      return;
    }

    if (isEditing) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  const handleCopyCredential = async (cred: any) => {
    try {
      const secret = await clientCredentialService.copy(cred.id);
      const text = cred.username ? `Usuário: ${cred.username}\nSenha: ${secret}` : `Senha: ${secret}`;
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copiado', description: `Credencial "${cred.label}" copiada.` });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível copiar.', variant: 'destructive' });
    }
  };

  if (isEditing && isLoadingCase) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center text-muted-foreground">Carregando dados do caso crítico...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/support/critical-cases')}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                {isEditing ? 'Editar Caso Crítico' : 'Novo Caso Crítico'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Preencha os campos para registro, alinhamento e plano de ação do suporte.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && existingCase && (
              <Button
                type="button"
                variant="outline"
                onClick={() => generateSingleCriticalCasePDF(existingCase)}
                className="flex items-center gap-2 border-primary/40 text-primary hover:bg-primary/10"
              >
                <FileDown className="h-4 w-4" />
                Dossiê PDF
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => navigate('/support/critical-cases')}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isEditing ? 'Atualizar Caso' : 'Salvar Caso'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Principal: Cliente & Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Identificação do Cliente e Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cliente Combobox */}
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="clientId">Cliente *</Label>
                  <Popover open={clientOpen} onOpenChange={setClientOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={clientOpen}
                        className="w-full justify-between font-normal text-left h-10"
                      >
                        {selectedClient ? (
                          <span className="truncate">
                            {selectedClient.nomeFantasia}{' '}
                            <span className="text-xs text-muted-foreground">({selectedClient.cnpj})</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Selecione ou busque o cliente...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar por nome ou CNPJ..." />
                        <CommandList>
                          <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {clients.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={`${c.nomeFantasia} ${c.cnpj}`}
                                onSelect={() => {
                                  setForm((prev) => ({ ...prev, clientId: c.id }));
                                  setClientOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    form.clientId === c.id ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{c.nomeFantasia}</span>
                                  <span className="text-xs text-muted-foreground font-mono">{c.cnpj}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Status Selector */}
                <div className="space-y-1.5">
                  <Label>Status do Caso *</Label>
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {STATUS_OPTIONS.map((st) => (
                      <Button
                        key={st}
                        type="button"
                        variant={form.status === st ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'text-xs h-9 justify-center',
                          form.status === st && st === 'ABERTO' && 'bg-amber-600 hover:bg-amber-700 text-white',
                          form.status === st && st === 'EM_ANDAMENTO' && 'bg-blue-600 hover:bg-blue-700 text-white',
                          form.status === st && st === 'RESOLVIDO' && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        )}
                        onClick={() => setForm((prev) => ({ ...prev, status: st }))}
                      >
                        {CRITICAL_CASE_STATUS_LABELS[st]}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Informações Rápidas do Cliente Selecionado */}
              {selectedClient && (
                <div className="p-4 bg-muted/30 rounded-lg border space-y-3 mt-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Link do Google Drive do Cliente:
                      </span>
                      <div className="mt-0.5">
                        {selectedClient.driveLink ? (
                          <a
                            href={selectedClient.driveLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1.5"
                          >
                            <FolderOpen className="h-4 w-4" />
                            {selectedClient.driveLink}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Nenhum link do Drive cadastrado na ficha do cliente.
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/clients/${selectedClient.id}`, '_blank')}
                      className="text-xs gap-1"
                    >
                      <Building2 className="h-3.5 w-3.5" /> Ficha do Cliente
                    </Button>
                  </div>

                  {/* Dados de Acesso Rápidos do Cliente */}
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5 mb-2">
                      <KeyRound className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                        Dados de Acesso Cadastrados ({clientCredentials.length}):
                      </span>
                    </div>

                    {clientCredentials.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Nenhuma credencial cadastrada para este cliente no Vault.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {clientCredentials.map((cred) => (
                          <div
                            key={cred.id}
                            className="p-2.5 rounded bg-card border text-xs flex justify-between items-center gap-2"
                          >
                            <div className="truncate">
                              <p className="font-semibold text-foreground truncate">{cred.label}</p>
                              {cred.username && (
                                <p className="text-muted-foreground font-mono text-[11px] truncate">
                                  ID: {cred.username}
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px] gap-1 shrink-0"
                              onClick={() => handleCopyCredential(cred)}
                              title="Copiar Acesso"
                            >
                              <Copy className="h-3 w-3" /> Copiar
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Tipos do Caso (Múltipla Escolha) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Categorias do Caso (Múltipla Escolha)
              </CardTitle>
              <CardDescription>
                Selecione uma ou mais categorias correspondentes a este registro.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CATEGORIES.map((cat) => {
                  const isChecked = (form.categories || []).includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "p-3 rounded-lg border text-sm font-medium transition-all flex items-center gap-2.5 select-none text-left cursor-pointer",
                        isChecked
                          ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary font-semibold"
                          : "border-border bg-card text-foreground hover:bg-muted/50"
                      )}
                    >
                      <div
                        className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0",
                          isChecked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/40 bg-background"
                        )}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{CRITICAL_CASE_CATEGORY_LABELS[cat]}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Card: Participantes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Participantes
              </CardTitle>
              <CardDescription>
                Informe quem esteve presente no alinhamento/reunião (ex: Nomes dos gestores do cliente, equipe interna).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Ex: João Silva (Diretor), Carlos Souza (Gerente TI), Leonardo Alves (Suporte)"
                value={form.participantes || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, participantes: e.target.value }))}
              />
            </CardContent>
          </Card>

          {/* Card: OBS (Observações e Histórico) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                OBS (Observações do Caso)
              </CardTitle>
              <CardDescription>
                Detalhamento da situação, histórico de chamados, relato do cliente ou pontos abordados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Descreva detalhadamente o ocorrido, queixas do cliente, pontos levantados ou ata do alinhamento..."
                rows={5}
                className="leading-relaxed"
                value={form.observacoes || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))}
              />
            </CardContent>
          </Card>

          {/* Card: Próximos Passos */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                Próximos Passos e Plano de Ação
              </CardTitle>
              <CardDescription>
                Ações a serem executadas, prazos combinados e responsáveis pelas próximas entregas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="1. Atualizar versão do PDV até sexta-feira&#10;2. Agendar treinamento com os operadores&#10;3. Realizar novo contato de acompanhamento dia 05..."
                rows={4}
                className="leading-relaxed font-mono text-sm"
                value={form.proximosPassos || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, proximosPassos: e.target.value }))}
              />
            </CardContent>
          </Card>

          {/* Linha do Tempo e Evoluções (apenas no modo de edição) */}
          {isEditing && id && (
            <CriticalCaseTimeline criticalCaseId={id} />
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/support/critical-cases')}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isEditing ? 'Atualizar Caso Crítico' : 'Salvar Caso Crítico'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  KeyRound,
  Search,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Building2,
  FolderOpen,
  Filter,
  ShieldCheck,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { clientCredentialService } from '@/services/clientCredentialService';
import { clientService } from '@/services/clientService';
import {
  ClientCredential,
  CreateClientCredentialDto,
  CLIENT_CREDENTIAL_TYPE_LABELS,
  ClientCredentialType,
} from '@/types/clientCredential';

const REVEAL_ROLES = ['admin', 'supervisao'];

const EMPTY_FORM: CreateClientCredentialDto = {
  clientId: '',
  type: 'ACESSO_REMOTO',
  label: '',
  secret: '',
};

export default function SupportCredentialsList() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { canEdit } = usePermissions('/support/credentials');

  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [openCreate, setOpenCreate] = useState(false);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState<CreateClientCredentialDto>(EMPTY_FORM);

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  const canReveal = user?.roles?.some((role) => REVEAL_ROLES.includes(role)) ?? false;

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list-credentials'],
    queryFn: () => clientService.findAll(),
  });

  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ['support-all-credentials', search, selectedClientId],
    queryFn: () =>
      clientCredentialService.findAll({
        search: search || undefined,
        clientId: selectedClientId !== 'all' ? selectedClientId : undefined,
      }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['support-all-credentials'] });

  const createMutation = useMutation({
    mutationFn: (data: CreateClientCredentialDto) => clientCredentialService.create(data),
    onSuccess: () => {
      invalidate();
      setOpenCreate(false);
      setFormData(EMPTY_FORM);
      toast({ title: 'Sucesso', description: 'Credencial cadastrada no vault de acessos.' });
    },
    onError: () => toast({ title: 'Erro', description: 'Falha ao salvar credencial.', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: clientCredentialService.delete,
    onSuccess: () => {
      invalidate();
      toast({ title: 'Excluída', description: 'Credencial removida com sucesso.' });
    },
    onError: () => toast({ title: 'Erro', description: 'Falha ao excluir credencial.', variant: 'destructive' }),
  });

  const handleCopy = async (credential: ClientCredential) => {
    try {
      const secret = await clientCredentialService.copy(credential.id);
      const parts = credential.username
        ? [`Usuário/ID Acesso: ${credential.username}`, `Senha: ${secret}`]
        : [`Senha: ${secret}`];
      await navigator.clipboard.writeText(parts.join('\n'));
      toast({
        title: 'Copiado',
        description: `Dados de acesso de "${credential.label}" copiados para a área de transferência.`,
      });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível copiar a credencial.', variant: 'destructive' });
    }
  };

  const handleOpenAccess = async (credential: ClientCredential) => {
    try {
      const secret = await clientCredentialService.copy(credential.id);
      await navigator.clipboard.writeText(secret);
      window.open(`anydesk:${credential.username}`, '_blank');
      toast({
        title: 'Abrindo Anydesk',
        description: 'Senha copiada para a área de transferência. Cole quando o Anydesk solicitar.',
      });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível abrir o acesso.', variant: 'destructive' });
    }
  };

  const handleReveal = async (credential: ClientCredential) => {
    if (revealedId === credential.id) {
      setRevealedId(null);
      setRevealedValue(null);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      return;
    }

    try {
      const secret = await clientCredentialService.reveal(credential.id);
      setRevealedId(credential.id);
      setRevealedValue(secret);

      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = setTimeout(() => {
        setRevealedId(null);
        setRevealedValue(null);
      }, 30000);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível revelar a senha.', variant: 'destructive' });
    }
  };

  const filteredCredentials = credentials.filter((c) => {
    if (selectedType !== 'all' && c.type !== selectedType) return false;
    return true;
  });

  const isAnydesk = (credential: ClientCredential) =>
    credential.type === 'ACESSO_REMOTO' && credential.label.toLowerCase().includes('anydesk');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <KeyRound className="h-6 w-6 text-primary" />
              Dados de Acesso dos Clientes
            </h1>
            <p className="text-sm text-muted-foreground">
              Consulta centralizada e segura de credenciais, acessos remotos e senhas de clientes para o Suporte.
            </p>
          </div>

          <Button
            onClick={() => {
              setFormData({ ...EMPTY_FORM, clientId: clients[0]?.id || '' });
              setOpenCreate(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Novo Acesso
          </Button>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, CNPJ, tipo ou label..."
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
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Filtrar por Tipo" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos de Acesso</SelectItem>
                    {Object.entries(CLIENT_CREDENTIAL_TYPE_LABELS).map(([val, label]) => (
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

        {/* Tabela de Credenciais */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base font-semibold">Credenciais Cadastradas</CardTitle>
                <CardDescription>
                  {filteredCredentials.length} acesso(s) encontrado(s)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-10 text-muted-foreground">Carregando dados de acesso...</div>
            ) : filteredCredentials.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="font-medium text-foreground">Nenhuma credencial encontrada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhum dado de acesso corresponde aos filtros aplicados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição / Identificação</TableHead>
                      <TableHead>Usuário / ID</TableHead>
                      <TableHead>Senha</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Drive</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCredentials.map((c) => {
                      const isRev = revealedId === c.id;
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">
                            {c.client ? (
                              <Link
                                to={`/clients/${c.client.id}`}
                                className="text-primary hover:underline flex items-center gap-1 font-semibold"
                              >
                                {c.client.nomeFantasia}
                                <ExternalLink className="h-3 w-3 inline" />
                              </Link>
                            ) : (
                              'Cliente não identificado'
                            )}
                            <span className="text-xs text-muted-foreground block">{c.client?.cnpj}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {CLIENT_CREDENTIAL_TYPE_LABELS[c.type] || c.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{c.label}</span>
                            {c.notes && <span className="text-xs text-muted-foreground block">{c.notes}</span>}
                          </TableCell>
                          <TableCell>
                            {c.username ? (
                              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                                {c.username}
                              </code>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isRev ? (
                              <code className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-2 py-0.5 rounded text-xs font-mono font-bold">
                                {revealedValue}
                              </code>
                            ) : (
                              <span className="text-muted-foreground tracking-widest text-xs">••••••••</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {c.responsavelNome ? (
                              <div className="text-xs space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span>{c.responsavelNome}</span>
                                </div>
                                {c.responsavelTelefone && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <span>{c.responsavelTelefone}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {c.client?.driveLink ? (
                              <a
                                href={c.client.driveLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                                title="Abrir Google Drive do Cliente"
                              >
                                <FolderOpen className="h-4 w-4" />
                                Abrir
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isAnydesk(c) && c.username && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs gap-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                  onClick={() => handleOpenAccess(c)}
                                  title="Abrir Anydesk e copiar senha"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Anydesk
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1"
                                onClick={() => handleCopy(c)}
                                title="Copiar Usuário e Senha"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                Copiar
                              </Button>

                              {canReveal && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleReveal(c)}
                                  title={isRev ? 'Ocultar' : 'Revelar por 30s'}
                                >
                                  {isRev ? (
                                    <EyeOff className="h-4 w-4 text-amber-600" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              )}

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
                                      <AlertDialogTitle>Excluir credencial?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta ação removerá a credencial "{c.label}" do cliente permanentemente.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive hover:bg-destructive/90"
                                        onClick={() => deleteMutation.mutate(c.id)}
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
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Criação de Credencial */}
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Cadastrar Novo Acesso / Credencial
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!formData.clientId) {
                  toast({ title: 'Atenção', description: 'Selecione um cliente.', variant: 'destructive' });
                  return;
                }
                if (!formData.label || !formData.secret) {
                  toast({ title: 'Atenção', description: 'Preencha a descrição e a senha.', variant: 'destructive' });
                  return;
                }
                createMutation.mutate(formData);
              }}
              className="space-y-4 pt-2"
            >
              <div>
                <Label>Cliente *</Label>
                <Select
                  value={formData.clientId || undefined}
                  onValueChange={(val) => setFormData({ ...formData, clientId: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nomeFantasia} ({c.cnpj})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Acesso *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => setFormData({ ...formData, type: val as ClientCredentialType })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CLIENT_CREDENTIAL_TYPE_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Identificação / Rótulo *</Label>
                  <Input
                    placeholder="Ex: Anydesk Servidor, VPN Matriz"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Usuário / ID de Conexão</Label>
                  <Input
                    placeholder="Ex: 987 654 321 ou admin"
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Senha / Chave Secreta *</Label>
                  <Input
                    type="password"
                    placeholder="Senha de acesso"
                    value={formData.secret}
                    onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-3">
                <Label className="text-xs font-semibold text-muted-foreground">Responsável pelo Acesso no Cliente</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Input
                    placeholder="Nome do Responsável"
                    value={formData.responsavelNome || ''}
                    onChange={(e) => setFormData({ ...formData, responsavelNome: e.target.value })}
                  />
                  <Input
                    placeholder="Telefone / Ramal"
                    value={formData.responsavelTelefone || ''}
                    onChange={(e) => setFormData({ ...formData, responsavelTelefone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Observações / Instruções</Label>
                <Textarea
                  placeholder="Instruções de conexão, horários, restrições..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 resize-none"
                  rows={2}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Salvando...' : 'Salvar Acesso'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

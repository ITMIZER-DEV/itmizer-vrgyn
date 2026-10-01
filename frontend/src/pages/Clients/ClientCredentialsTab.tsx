import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus, Trash2, Copy, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { clientCredentialService } from '@/services/clientCredentialService';
import {
  ClientCredential, CreateClientCredentialDto, CLIENT_CREDENTIAL_TYPE_LABELS,
} from '@/types/clientCredential';

interface Props {
  clientId: string;
}

const EMPTY_FORM: CreateClientCredentialDto = {
  clientId: '',
  type: 'ACESSO_REMOTO',
  label: '',
  secret: '',
};

const REVEAL_ROLES = ['admin', 'supervisao'];

export default function ClientCredentialsTab({ clientId }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { canEdit } = usePermissions('/clients');
  const [open, setOpen] = useState(false);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  const canReveal = user?.roles?.some((role) => REVEAL_ROLES.includes(role)) ?? false;

  const { register, handleSubmit, reset, control } = useForm<CreateClientCredentialDto>({
    defaultValues: EMPTY_FORM,
  });

  const { data: credentials, isLoading } = useQuery({
    queryKey: ['client-credentials', clientId],
    queryFn: () => clientCredentialService.findByClient(clientId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['client-credentials', clientId] });

  const createMutation = useMutation({
    mutationFn: (data: CreateClientCredentialDto) => clientCredentialService.create(data),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast({ title: 'Sucesso', description: 'Credencial cadastrada no vault.' });
    },
    onError: () => toast({ title: 'Erro', description: 'Falha ao salvar credencial.', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: clientCredentialService.delete,
    onSuccess: () => {
      invalidate();
      toast({ title: 'Excluída', description: 'Credencial removida do vault.' });
    },
    onError: () => toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' }),
  });

  const openCreate = () => {
    reset({ ...EMPTY_FORM, clientId });
    setOpen(true);
  };

  const isAnydesk = (credential: ClientCredential) =>
    credential.type === 'ACESSO_REMOTO' && credential.label.toLowerCase().includes('anydesk');

  const handleCopy = async (credential: ClientCredential) => {
    try {
      const secret = await clientCredentialService.copy(credential.id);
      const parts = credential.username ? [`Usuário/ID Acesso: ${credential.username}`, `Senha: ${secret}`] : [`Senha: ${secret}`];
      await navigator.clipboard.writeText(parts.join('\n'));
      toast({ title: 'Copiado', description: `Dados de acesso de "${credential.label}" copiados para a área de transferência.` });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível copiar a credencial.', variant: 'destructive' });
    }
  };

  const handleOpenAccess = async (credential: ClientCredential) => {
    try {
      const secret = await clientCredentialService.copy(credential.id);
      await navigator.clipboard.writeText(secret);
      window.open(`anydesk:${credential.username}`, '_blank');
      toast({ title: 'Abrindo Anydesk', description: 'Senha copiada para a área de transferência. Cole quando o Anydesk solicitar.' });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível abrir o acesso.', variant: 'destructive' });
    }
  };

  const handleReveal = async (credential: ClientCredential) => {
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
    if (revealedId === credential.id) {
      setRevealedId(null);
      setRevealedValue(null);
      return;
    }
    try {
      const secret = await clientCredentialService.reveal(credential.id);
      setRevealedId(credential.id);
      setRevealedValue(secret);
      toast({ title: 'Atenção', description: 'Esta visualização foi registrada em auditoria.' });
      revealTimeoutRef.current = setTimeout(() => {
        setRevealedId(null);
        setRevealedValue(null);
        revealTimeoutRef.current = null;
      }, 15000);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível revelar a credencial.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" /> Vault de Acessos
        </h3>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" onClick={openCreate}>
                <Plus className="w-4 h-4" /> Nova Credencial
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Credencial</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(CLIENT_CREDENTIAL_TYPE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label">Rótulo *</Label>
                  <Input id="label" {...register('label', { required: true })} placeholder="Ex: Anydesk Servidor Principal" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Usuário/ID Acesso</Label>
                    <Input id="username" {...register('username')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secret">Senha *</Label>
                    <Input id="secret" type="password" {...register('secret', { required: true })} />
                  </div>
                </div>
                <div className="pt-2 border-t space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">Responsável pela liberação (contato do cliente)</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="responsavelNome">Nome</Label>
                      <Input id="responsavelNome" {...register('responsavelNome')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="responsavelTelefone">Telefone</Label>
                      <Input id="responsavelTelefone" {...register('responsavelTelefone')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="responsavelEmail">E-mail</Label>
                      <Input id="responsavelEmail" type="email" {...register('responsavelEmail')} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea id="notes" {...register('notes')} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Rótulo</TableHead>
              <TableHead>Usuário/ID Acesso</TableHead>
              <TableHead>Responsável pela liberação</TableHead>
              <TableHead>Senha</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            )}
            {!isLoading && (!credentials || credentials.length === 0) && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Nenhuma credencial cadastrada.</TableCell></TableRow>
            )}
            {credentials?.map((credential) => (
              <TableRow key={credential.id}>
                <TableCell><Badge variant="outline">{CLIENT_CREDENTIAL_TYPE_LABELS[credential.type]}</Badge></TableCell>
                <TableCell className="font-medium">{credential.label}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{credential.username || '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {credential.responsavelNome || '-'}
                  {credential.responsavelTelefone && <div className="text-xs">{credential.responsavelTelefone}</div>}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {revealedId === credential.id ? revealedValue : '••••••••'}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" title="Copiar dados de acesso" onClick={() => handleCopy(credential)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  {isAnydesk(credential) && credential.username && (
                    <Button variant="ghost" size="icon" title="Abrir no Anydesk" onClick={() => handleOpenAccess(credential)}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                  {canReveal && (
                    <Button variant="ghost" size="icon" title="Revelar" onClick={() => handleReveal(credential)}>
                      {revealedId === credential.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  )}
                  {canReveal && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir credencial?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(credential.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

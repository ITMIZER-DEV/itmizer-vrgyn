import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Server, Plus, Pencil, Trash2 } from 'lucide-react';
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
import { usePermissions } from '@/hooks/usePermissions';
import { clientInfrastructureService } from '@/services/clientInfrastructureService';
import {
  ClientInfrastructure, ClientInfraType, CreateClientInfrastructureDto, CLIENT_INFRA_TYPE_LABELS,
} from '@/types/clientInfrastructure';

interface Props {
  clientId: string;
}

const EMPTY_FORM: CreateClientInfrastructureDto = {
  clientId: '',
  type: 'SERVIDOR_APLICACAO',
  nome: '',
};

export default function ClientInfrastructureTab({ clientId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canEdit } = usePermissions('/clients');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClientInfrastructure | null>(null);

  const { register, handleSubmit, reset, control } = useForm<CreateClientInfrastructureDto>({
    defaultValues: EMPTY_FORM,
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['client-infrastructure', clientId],
    queryFn: () => clientInfrastructureService.findByClient(clientId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['client-infrastructure', clientId] });

  const saveMutation = useMutation({
    mutationFn: (data: CreateClientInfrastructureDto) => {
      if (editing) return clientInfrastructureService.update(editing.id, data);
      return clientInfrastructureService.create(data);
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast({ title: 'Sucesso', description: `Registro ${editing ? 'atualizado' : 'criado'} com sucesso.` });
    },
    onError: () => toast({ title: 'Erro', description: 'Falha ao salvar registro.', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: clientInfrastructureService.delete,
    onSuccess: () => {
      invalidate();
      toast({ title: 'Excluído', description: 'Registro removido.' });
    },
    onError: () => toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' }),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ ...EMPTY_FORM, clientId });
    setOpen(true);
  };

  const openEdit = (item: ClientInfrastructure) => {
    setEditing(item);
    reset({
      clientId,
      type: item.type,
      nome: item.nome,
      hostname: item.hostname ?? '',
      ipAddress: item.ipAddress ?? '',
      operatingSystem: item.operatingSystem ?? '',
      cpuModel: item.cpuModel ?? '',
      ramGb: item.ramGb ?? undefined,
      storageGb: item.storageGb ?? undefined,
      storageType: item.storageType ?? '',
      observacoes: item.observacoes ?? '',
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" /> Infraestrutura do Cliente
        </h3>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" onClick={openCreate}>
                <Plus className="w-4 h-4" /> Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar' : 'Novo'} Registro de Infraestrutura</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(CLIENT_INFRA_TYPE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" {...register('nome', { required: true })} placeholder="Ex: Servidor Principal" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hostname">Hostname</Label>
                    <Input id="hostname" {...register('hostname')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ipAddress">IP</Label>
                    <Input id="ipAddress" {...register('ipAddress')} placeholder="192.168.0.10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="operatingSystem">Sistema Operacional</Label>
                    <Input id="operatingSystem" {...register('operatingSystem')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpuModel">CPU</Label>
                    <Input id="cpuModel" {...register('cpuModel')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ramGb">RAM (GB)</Label>
                    <Input id="ramGb" type="number" {...register('ramGb', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storageGb">Armazenamento (GB)</Label>
                    <Input id="storageGb" type="number" {...register('storageGb', { valueAsNumber: true })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea id="observacoes" {...register('observacoes')} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
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
              <TableHead>Nome</TableHead>
              <TableHead>Hostname / IP</TableHead>
              <TableHead>SO</TableHead>
              {canEdit && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            )}
            {!isLoading && (!items || items.length === 0) && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhum registro de infraestrutura cadastrado.</TableCell></TableRow>
            )}
            {items?.map((item) => (
              <TableRow key={item.id}>
                <TableCell><Badge variant="outline">{CLIENT_INFRA_TYPE_LABELS[item.type]}</Badge></TableCell>
                <TableCell className="font-medium">{item.nome}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{[item.hostname, item.ipAddress].filter(Boolean).join(' / ') || '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.operatingSystem || '-'}</TableCell>
                {canEdit && (
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(item.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

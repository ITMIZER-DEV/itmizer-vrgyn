import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ticket, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { clientTicketService } from '@/services/clientTicketService';
import {
  ClientTicket, CreateClientTicketDto, TICKET_URGENCIA_LABELS, TICKET_URGENCIA_COLORS,
} from '@/types/clientTicket';

interface Props {
  clientId: string;
}

const EMPTY_FORM: CreateClientTicketDto = {
  clientId: '',
  data: '',
  numero: '',
  assunto: '',
  classificacao: 'BAIXA',
};

export default function ClientTicketsTab({ clientId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canEdit } = usePermissions('/clients');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClientTicket | null>(null);

  const { register, handleSubmit, reset, control } = useForm<CreateClientTicketDto>({
    defaultValues: EMPTY_FORM,
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['client-tickets', clientId],
    queryFn: () => clientTicketService.findByClient(clientId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['client-tickets', clientId] });

  const saveMutation = useMutation({
    mutationFn: (data: CreateClientTicketDto) => {
      if (editing) return clientTicketService.update(editing.id, data);
      return clientTicketService.create(data);
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast({ title: 'Sucesso', description: `Ticket ${editing ? 'atualizado' : 'cadastrado'} com sucesso.` });
    },
    onError: () => toast({ title: 'Erro', description: 'Falha ao salvar o ticket.', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: clientTicketService.delete,
    onSuccess: () => {
      invalidate();
      toast({ title: 'Excluído', description: 'Ticket removido.' });
    },
    onError: () => toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' }),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ ...EMPTY_FORM, clientId });
    setOpen(true);
  };

  const openEdit = (item: ClientTicket) => {
    setEditing(item);
    reset({
      clientId,
      data: item.data.slice(0, 10),
      numero: item.numero,
      assunto: item.assunto,
      classificacao: item.classificacao,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Ticket className="w-4 h-4 text-primary" /> Tickets (Movidesk)
        </h3>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" onClick={openCreate}>
                <Plus className="w-4 h-4" /> Novo Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar' : 'Novo'} Ticket</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data">Data *</Label>
                    <Input id="data" type="date" {...register('data', { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número *</Label>
                    <Input id="numero" {...register('numero', { required: true })} placeholder="Ex: 100234" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assunto">Assunto *</Label>
                  <Input id="assunto" {...register('assunto', { required: true })} placeholder="Ex: Erro ao emitir NF-e" />
                </div>
                <div className="space-y-2">
                  <Label>Classificação</Label>
                  <Controller
                    name="classificacao"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(TICKET_URGENCIA_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
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
              <TableHead>Data</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Classificação</TableHead>
              {canEdit && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            )}
            {!isLoading && (!tickets || tickets.length === 0) && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhum ticket cadastrado.</TableCell></TableRow>
            )}
            {tickets?.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-sm">{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="font-medium">{item.numero}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.assunto}</TableCell>
                <TableCell><Badge className={TICKET_URGENCIA_COLORS[item.classificacao]}>{TICKET_URGENCIA_LABELS[item.classificacao]}</Badge></TableCell>
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
                          <AlertDialogTitle>Excluir ticket?</AlertDialogTitle>
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

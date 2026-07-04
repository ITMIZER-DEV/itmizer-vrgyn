import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { clientService, CreateClientDto } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Save, Plus, Building2, Pencil, Link as LinkIcon } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

interface ClientModalProps {
    clientId?: string; // Se for edição, passar o clientId
    children?: React.ReactNode;
    onSuccess?: (client: any) => void;
}

export function ClientModal({ clientId, children, onSuccess }: ClientModalProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isEditing = !!clientId;
    const { canSpecial } = usePermissions('/clients');

    const { register, handleSubmit, reset } = useForm<CreateClientDto>();

    const { data: client, isLoading } = useQuery({
        queryKey: ['client', clientId],
        queryFn: () => clientService.findOne(clientId!),
        enabled: isEditing && open, // Apenas busca quando o modal está aberto e em modo de edição
    });

    useEffect(() => {
        if (client && open) {
            reset(client);
        } else if (!open && !isEditing) {
            reset({ nomeFantasia: '', razaoSocial: '', cnpj: '', endereco: '', contatoNome: '', contatoEmail: '', contatoTelefone: '', driveLink: '' });
        }
    }, [client, open, isEditing, reset]);

    const mutation = useMutation({
        mutationFn: (data: CreateClientDto) => {
            if (isEditing) {
                return clientService.update(clientId!, data);
            }
            return clientService.create(data);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast({ title: 'Sucesso', description: `Cliente ${isEditing ? 'atualizado' : 'criado'} com sucesso.` });
            setOpen(false);
            if (onSuccess) onSuccess(data);
        },
        onError: (error) => {
            console.error(error);
            toast({ title: 'Erro', description: 'Falha ao salvar cliente.', variant: 'destructive' });
        },
    });

    const onSubmit = (data: CreateClientDto) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="gradient-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Cliente
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Atualize as informações do cliente abaixo.' : 'Preencha os dados do novo cliente para adicioná-lo à base.'}
                    </DialogDescription>
                </DialogHeader>

                {isEditing && isLoading ? (
                    <div className="flex justify-center p-8">Carregando...</div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
                                <Input id="nomeFantasia" {...register('nomeFantasia', { required: true })} placeholder="Ex: Empresa X" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="razaoSocial">Razão Social</Label>
                                <Input id="razaoSocial" {...register('razaoSocial')} placeholder="Ex: Empresa X LTDA" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cnpj">CNPJ *</Label>
                                <Input id="cnpj" {...register('cnpj', { required: true })} placeholder="00.000.000/0000-00" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endereco">Endereço</Label>
                                <Input id="endereco" {...register('endereco')} placeholder="Rua, número, cidade..." />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <h3 className="font-semibold mb-4 text-sm">Contato</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="contatoNome">Nome do Contato</Label>
                                    <Input id="contatoNome" {...register('contatoNome')} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contatoEmail">Email</Label>
                                    <Input id="contatoEmail" type="email" {...register('contatoEmail')} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contatoTelefone">Telefone</Label>
                                    <Input id="contatoTelefone" {...register('contatoTelefone')} />
                                </div>
                            </div>
                        </div>

                        {canSpecial && (
                            <div className="pt-4 border-t border-border">
                                <h3 className="font-semibold mb-4 text-sm flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4 text-primary" />
                                    Documentação
                                </h3>
                                <div className="space-y-2">
                                    <Label htmlFor="driveLink">Link do Drive</Label>
                                    <Input id="driveLink" {...register('driveLink')} placeholder="https://drive.google.com/..." />
                                </div>
                            </div>
                        )}

                        <DialogFooter className="pt-4 mt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="gradient-primary gap-2" disabled={mutation.isPending}>
                                <Save className="w-4 h-4" />
                                {mutation.isPending ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

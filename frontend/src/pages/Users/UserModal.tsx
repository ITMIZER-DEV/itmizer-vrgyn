import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { userService, CreateUserDto, AppRole } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Save, UserPlus, Pencil } from 'lucide-react';

interface UserModalProps {
    userId?: string; // Se passado, modo de edição
    children?: React.ReactNode;
}

export function UserModal({ userId, children }: UserModalProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isEditing = !!userId;

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CreateUserDto>({
        defaultValues: { role: 'seller' }
    });

    const { data: user, isLoading } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => userService.findOne(userId!),
        enabled: isEditing && open,
    });

    useEffect(() => {
        if (user && open) {
            reset({
                email: user.email,
                fullName: user.profile?.fullName,
                role: user.roles?.[0]?.role || 'seller',
                password: '', // Não editamos senha aqui
            });
        } else if (!open && !isEditing) {
            reset({ email: '', fullName: '', role: 'seller', password: '' });
        }
    }, [user, open, isEditing, reset]);

    const mutation = useMutation({
        mutationFn: (data: CreateUserDto) => {
            if (isEditing) return userService.update(userId!, data);
            return userService.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast({ title: 'Sucesso', description: `Usuário ${isEditing ? 'atualizado' : 'criado'} com sucesso.` });
            setOpen(false);
        },
        onError: (error) => {
            console.error(error);
            toast({ title: 'Erro', description: 'Falha ao salvar usuário.', variant: 'destructive' });
        },
    });

    const onSubmit = (data: CreateUserDto) => {
        if (isEditing && !data.password) {
            delete data.password;
        }
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <UserPlus className="w-4 h-4" /> Novo Usuário
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Altere os dados do usuário abaixo.' : 'Preencha os dados para cadastrar um novo usuário na plataforma.'}
                    </DialogDescription>
                </DialogHeader>

                {isEditing && isLoading ? (
                    <div className="flex justify-center p-8">Carregando...</div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nome Completo</Label>
                            <Input id="fullName" {...register('fullName')} placeholder="Nome do usuário" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input id="email" type="email" {...register('email', { required: true })} placeholder="email@exemplo.com" />
                            {errors.email && <span className="text-sm text-destructive">Email é obrigatório</span>}
                        </div>

                        {!isEditing && (
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register('password', { required: !isEditing })}
                                    placeholder="Senha forte"
                                />
                                {errors.password && <span className="text-sm text-destructive">Senha é obrigatória</span>}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Nível de Acesso *</Label>
                            <Controller
                                name="role"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecione o nível de acesso" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                            <SelectItem value="supervisao">Supervisor</SelectItem>
                                            <SelectItem value="user">Usuário</SelectItem>
                                            <SelectItem value="support">Suporte</SelectItem>
                                            <SelectItem value="seller">Vendedor</SelectItem>
                                            <SelectItem value="migrador">Migrador</SelectItem>
                                            <SelectItem value="implantador">Implantador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.role && <span className="text-sm text-destructive">Nível de acesso é obrigatório</span>}
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="gap-2" disabled={mutation.isPending}>
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

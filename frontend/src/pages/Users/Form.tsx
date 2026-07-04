import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { userService, CreateUserDto, AppRole, AppRoleLabels } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';

export default function UserForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isEditing = !!id;

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CreateUserDto>({
        defaultValues: {
            role: 'seller'
        }
    });

    const { data: user, isLoading } = useQuery({
        queryKey: ['user', id],
        queryFn: () => userService.findOne(id!),
        enabled: isEditing,
    });

    useEffect(() => {
        if (user) {
            reset({
                email: user.email,
                fullName: user.profile?.fullName,
                role: user.roles[0]?.role || 'seller',
                password: '', // Não editamos senha aqui
            });
        }
    }, [user, reset]);

    const mutation = useMutation({
        mutationFn: (data: CreateUserDto) => {
            if (isEditing) {
                return userService.update(id!, data);
            }
            return userService.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast({ title: 'Sucesso', description: `Usuário ${isEditing ? 'atualizado' : 'criado'} com sucesso.` });
            navigate('/users');
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

    if (isEditing && isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center p-8">Carregando...</div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold font-display">
                            {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
                        </h1>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Usuário</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
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
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => navigate('/users')}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="gradient-primary" disabled={mutation.isPending}>
                                    <Save className="w-4 h-4 mr-2" />
                                    {mutation.isPending ? 'Salvando...' : 'Salvar'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

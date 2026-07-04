import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { userService, CreateUserDto } from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, User as UserIcon, Lock } from 'lucide-react';

export default function Profile() {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Dados Pessoais Form
    const { register: registerPersonal, handleSubmit: handlePersonalSubmit, reset: resetPersonal } = useForm<Partial<CreateUserDto>>();

    // Senha Form
    const { register: registerPassword, handleSubmit: handlePasswordSubmit, watch, reset: resetPassword } = useForm();

    const newPassword = watch("newPassword");

    useEffect(() => {
        if (user) {
            resetPersonal({
                fullName: user.profile?.fullName || '',
                email: user.email || ''
            });
        }
    }, [user, resetPersonal]);

    const updateMutation = useMutation({
        mutationFn: (data: Partial<CreateUserDto>) => userService.update(user!.id, data),
        onSuccess: () => {
            // Invalidation allows the hook to retrieve fresh data globally if cached (though rely usually on local storage or relogin)
            queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
            toast({ title: 'Sucesso', description: 'Dados atualizados com sucesso.' });
        },
        onError: (error) => {
            console.error(error);
            toast({ title: 'Erro', description: 'Ocorreu um erro ao atualizar os dados.', variant: 'destructive' });
        },
    });

    const onPersonalSubmit = (data: Partial<CreateUserDto>) => {
        if (!user) return;
        updateMutation.mutate(data);
    };

    const onPasswordSubmit = (data: any) => {
        if (!user) return;
        if (data.newPassword !== data.confirmPassword) {
            toast({ title: 'Atenção', description: 'A confirmação de senha não confere.', variant: 'destructive' });
            return;
        }

        // As senhas conferem, enviar atualização
        updateMutation.mutate(
            { password: data.newPassword },
            {
                onSuccess: () => {
                    resetPassword();
                    toast({ title: 'Senha alterada', description: 'Sua senha foi alterada com sucesso.' });
                }
            }
        );
    };

    if (loading || !user) {
        return (
            <DashboardLayout>
                <div className="flex justify-center p-8">Carregando perfil...</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-display flex items-center gap-2">
                        <UserIcon className="w-8 h-8 text-primary" />
                        Meu Perfil
                    </h1>
                    <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais e credenciais de acesso</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Card: Dados Pessoais */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Dados Pessoais</CardTitle>
                            <CardDescription>Mantenha seu nome e email atualizados.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePersonalSubmit(onPersonalSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Nome Completo</Label>
                                    <Input id="fullName" {...registerPersonal('fullName', { required: true })} placeholder="Seu nome" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" {...registerPersonal('email', { required: true })} placeholder="seu@email.com" />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button type="submit" className="gradient-primary gap-2" disabled={updateMutation.isPending}>
                                        <Save className="w-4 h-4" />
                                        Salvar Dados
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Card: Senha */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                                <Lock className="w-5 h-5" />
                                Segurança
                            </CardTitle>
                            <CardDescription>Altere sua senha de acesso periodicamente.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Nova Senha</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        {...registerPassword('newPassword', { required: true, minLength: 6 })}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirme a Nova Senha</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        {...registerPassword('confirmPassword', { required: true })}
                                        placeholder="Repita a nova senha"
                                    />
                                    {newPassword && watch("confirmPassword") && newPassword !== watch("confirmPassword") && (
                                        <p className="text-xs text-destructive mt-1">As senhas não conferem</p>
                                    )}
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button type="submit" variant="destructive" className="gap-2" disabled={updateMutation.isPending}>
                                        <Lock className="w-4 h-4" />
                                        Alterar Senha
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

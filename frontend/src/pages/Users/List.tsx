import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { userService, User, AppRoleLabels } from '@/services/userService';
import type { AppRole } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Pencil, Search, User as UserIcon, UserCheck, UserX, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { UserModal } from './UserModal';

const roleBadgeColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 border-red-200',
    supervisao: 'bg-purple-100 text-purple-700 border-purple-200',
    user: 'bg-gray-100 text-gray-700 border-gray-200',
    support: 'bg-blue-100 text-blue-700 border-blue-200',
    seller: 'bg-green-100 text-green-700 border-green-200',
};

interface UsersListProps {
    roleFilter?: AppRole;
    title?: string;
}

export function UsersListContent({ roleFilter, title }: UsersListProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: userService.findAll,
    });

    const toggleActiveMutation = useMutation({
        mutationFn: userService.toggleActive,
        onSuccess: (updatedUser) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast({
                title: updatedUser.isActive ? 'Usuário ativado' : 'Usuário inativado',
                description: `O usuário foi ${updatedUser.isActive ? 'ativado' : 'inativado'} com sucesso.`,
            });
        },
        onError: () => {
            toast({ title: 'Erro', description: 'Falha ao alterar status do usuário.', variant: 'destructive' });
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ id, role }: { id: string; role: AppRole }) => userService.updateRole(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast({ title: 'Sucesso', description: 'Nível de acesso alterado.' });
        },
        onError: () => {
            toast({ title: 'Erro', description: 'Falha ao alterar nível de acesso.', variant: 'destructive' });
        },
    });

    const filteredUsers = users?.filter(user => {
        const matchesSearch =
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.profile?.fullName && user.profile.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && user.isActive) ||
            (statusFilter === 'inactive' && !user.isActive);

        const matchesRole = roleFilter ? user.roles?.some(r => r.role === roleFilter) : true;

        return matchesSearch && matchesStatus && matchesRole;
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold font-display">{title || 'Gestão de Usuários'}</h1>
                    <p className="text-muted-foreground">Gerencie o acesso ao sistema</p>
                </div>
                <UserModal />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 max-w-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={statusFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('all')}
                        className={statusFilter === 'all' ? 'bg-blue-600' : ''}
                    >
                        Todos
                    </Button>
                    <Button
                        variant={statusFilter === 'active' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('active')}
                        className={statusFilter === 'active' ? 'bg-blue-600' : ''}
                    >
                        Ativos
                    </Button>
                    <Button
                        variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('inactive')}
                        className={statusFilter === 'inactive' ? 'bg-blue-600' : ''}
                    >
                        Inativos
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Usuário</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Nível de Acesso</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                                Nenhum usuário encontrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers?.map((user) => (
                                            <TableRow key={user.id} className={!user.isActive ? 'opacity-60' : ''}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <UserIcon className="w-4 h-4 text-primary" />
                                                        </div>
                                                        {user.profile?.fullName || 'Sem nome'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 w-[160px]">
                                                        {user.roles.length > 0 ? (
                                                            <Select
                                                                defaultValue={user.roles[0].role as string}
                                                                onValueChange={(val) => updateRoleMutation.mutate({ id: user.id, role: val as AppRole })}
                                                                disabled={updateRoleMutation.isPending}
                                                            >
                                                                <SelectTrigger className="h-8 shadow-none focus:ring-0">
                                                                    <SelectValue placeholder="Selecione..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {(Object.entries(AppRoleLabels) as [AppRole, string][]).map(([key, label]) => (
                                                                        <SelectItem key={key} value={key}>
                                                                            {label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs italic">Nenhum</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            user.isActive
                                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                                : 'bg-red-100 text-red-700 border-red-200'
                                                        }
                                                    >
                                                        {user.isActive ? 'Ativo' : 'Inativo'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <UserModal userId={user.id}>
                                                            <Button variant="ghost" size="icon">
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                        </UserModal>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className={
                                                                        user.isActive
                                                                            ? 'text-destructive hover:text-destructive'
                                                                            : 'text-emerald-600 hover:text-emerald-600'
                                                                    }
                                                                >
                                                                    {user.isActive ? (
                                                                        <UserX className="w-4 h-4" />
                                                                    ) : (
                                                                        <UserCheck className="w-4 h-4" />
                                                                    )}
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>
                                                                        {user.isActive ? 'Inativar usuário?' : 'Ativar usuário?'}
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        {user.isActive
                                                                            ? 'O usuário não poderá acessar o sistema enquanto estiver inativo.'
                                                                            : 'O usuário voltará a ter acesso ao sistema.'
                                                                        }
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => toggleActiveMutation.mutate(user.id)}
                                                                        className={
                                                                            user.isActive
                                                                                ? 'bg-destructive hover:bg-destructive/90'
                                                                                : 'bg-emerald-600 hover:bg-emerald-700'
                                                                        }
                                                                    >
                                                                        {user.isActive ? 'Inativar' : 'Ativar'}
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function UsersList({ roleFilter, title }: UsersListProps) {
    return (
        <DashboardLayout>
            <UsersListContent roleFilter={roleFilter} title={title} />
        </DashboardLayout>
    );
}

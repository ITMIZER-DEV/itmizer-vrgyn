import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { migrationService, Migration, MigrationStatus, MigrationStatusLabels, MigrationStatusColors } from '@/services/migrationService';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Pencil, Search, Trash2, FileText, Clock, CalendarDays, CalendarCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
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
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

const statusFilters: { label: string; value: MigrationStatus | 'all' }[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Pendente', value: 'pendente' },
    { label: 'Em Validação', value: 'em_validacao' },
    { label: 'Em Andamento', value: 'em_andamento' },
    { label: 'Concluída', value: 'concluida' },
    { label: 'Cancelada', value: 'cancelada' },
];

import { usePermissions } from '@/hooks/usePermissions';

export default function MigrationList() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<MigrationStatus | 'all'>('all');
    const { canEdit } = usePermissions('/migration');

    const { data: migrations, isLoading } = useQuery({
        queryKey: ['migrations'],
        queryFn: migrationService.findAll,
    });

    const deleteMutation = useMutation({
        mutationFn: migrationService.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['migrations'] });
            toast({ title: 'Migração removida', description: 'A migração foi removida com sucesso.' });
        },
        onError: () => {
            toast({ title: 'Erro', description: 'Falha ao remover migração.', variant: 'destructive' });
        },
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const calculateTotalHours = (migration: Migration) => {
        let totalHours = 0;
        if (migration.items) {
            Object.entries(migration.items).forEach(([key, item]) => {
                if (item.migrar) {
                    const hours = parseInt(item.tempoEstimado) || 0;
                    totalHours += hours;
                }
            });
        }
        return totalHours;
    };

    const filtered = migrations?.filter(m => {
        const matchesSearch = m.client?.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.client?.cnpj?.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const columns: ColumnDef<Migration>[] = [
        {
            id: "client_nomeFantasia",
            accessorKey: "client.nomeFantasia",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-transparent -ml-4"
                    >
                        Cliente
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <div className="font-semibold">{row.original.client?.nomeFantasia || '-'}</div>
                        <div className="text-xs text-muted-foreground">{row.original.client?.cnpj}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "nomeSistema",
            header: "Sistema Atual",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant="outline" className={MigrationStatusColors[row.original.status]}>
                    {MigrationStatusLabels[row.original.status]}
                </Badge>
            ),
        },
        {
            id: "horas",
            header: "Total de Horas",
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {calculateTotalHours(row.original)}h
                </div>
            ),
        },
        {
            accessorKey: "dataPrevistaVirada",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent -ml-4"
                >
                    <CalendarDays className="mr-1.5 h-4 w-4 text-muted-foreground" />
                    Prev. Virada
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const val = row.getValue("dataPrevistaVirada") as string | undefined;
                return val ? formatDate(val) : <span className="text-muted-foreground text-xs">—</span>;
            },
        },
        {
            accessorKey: "dataViradaSistema",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent -ml-4"
                >
                    <CalendarCheck className="mr-1.5 h-4 w-4 text-muted-foreground" />
                    Virada Sistema
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const val = row.getValue("dataViradaSistema") as string | undefined;
                return val ? formatDate(val) : <span className="text-muted-foreground text-xs">—</span>;
            },
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-transparent -ml-4"
                    >
                        Criado em
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => formatDate(String(row.getValue("createdAt"))),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const migration = row.original;
                return (
                    <div className="text-right flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/migration/${migration.id}`)}>
                            <Pencil className="w-4 h-4" />
                        </Button>
                        {canEdit && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Remover migração?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação irá remover a migração e todo o histórico associado. Não pode ser desfeita.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => deleteMutation.mutate(migration.id)}
                                            className="bg-destructive hover:bg-destructive/90"
                                        >
                                            Remover
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                )
            },
        },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-display">Migrações</h1>
                        <p className="text-muted-foreground">Gerencie as migrações de dados por cliente</p>
                    </div>
                    {canEdit && (
                        <Button onClick={() => navigate('/migration/new')} className="gradient-primary">
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Migração
                        </Button>
                    )}
                </div>

                <Card className="glass-card">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Listagem Corporativa
                            </h2>
                            <div className="flex gap-2 flex-wrap">
                                {statusFilters.map(f => (
                                    <Button
                                        key={f.value}
                                        variant={statusFilter === f.value ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-7 text-[10px] px-2"
                                        onClick={() => setStatusFilter(f.value)}
                                    >
                                        {f.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-4 text-muted-foreground animate-pulse">Carregando migrações...</p>
                            </div>
                        ) : (
                            <DataTable 
                                columns={columns} 
                                data={filtered || []} 
                                searchKey="client_nomeFantasia" 
                                filename="migracoes-itmizer"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

        </DashboardLayout>
    );
}

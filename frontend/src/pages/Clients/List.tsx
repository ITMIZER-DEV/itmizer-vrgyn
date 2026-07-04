import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { clientService, Client } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Search, Building2, MoreHorizontal, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { ClientModal } from './ClientModal';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

export default function ClientsList() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: clients, isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: clientService.findAll,
    });

    const deleteMutation = useMutation({
        mutationFn: clientService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast({ title: 'Cliente excluído', description: 'O cliente foi removido com sucesso.' });
        },
        onError: () => {
            toast({ title: 'Erro', description: 'Falha ao excluir cliente.', variant: 'destructive' });
        },
    });

    const columns: ColumnDef<Client>[] = [
        {
            accessorKey: "nomeFantasia",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-transparent -ml-4"
                    >
                        Nome Fantasia
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary/50" />
                    {row.getValue("nomeFantasia")}
                </div>
            ),
        },
        {
            accessorKey: "cnpj",
            header: "CNPJ",
        },
        {
            accessorKey: "contatoNome",
            header: "Contato",
            cell: ({ row }) => (
                <div>
                    <div>{row.getValue("contatoNome") || '-'}</div>
                    <div className="text-xs text-muted-foreground">{row.original.contatoEmail}</div>
                </div>
            ),
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
                        Data Cadastro
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString('pt-BR'),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const client = row.original;
                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}`)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Detalhes / Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/assessments?clientId=${client.id}&create=true`)}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Nova Validação
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                        if (confirm('Tem certeza que deseja excluir este cliente?')) {
                                            deleteMutation.mutate(client.id);
                                        }
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                        <h1 className="text-3xl font-bold font-display">Clientes</h1>
                        <p className="text-muted-foreground">Gerencie a base de clientes para validações</p>
                    </div>
                    <ClientModal />
                </div>

                <Card className="glass-card shadow-lg border-2">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-display font-semibold flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            Listagem Corporativa
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-4 text-muted-foreground animate-pulse">Carregando base de clientes...</p>
                            </div>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={clients || []}
                                searchKey="nomeFantasia"
                                filename="clientes-itmizer"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

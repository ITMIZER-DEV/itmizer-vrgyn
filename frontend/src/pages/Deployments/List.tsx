import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, MapIcon, Trash2, Calendar, ExternalLink, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

import { deploymentService, DeploymentStatusLabels, DeploymentStatusColors } from '@/services/deploymentService';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function DeploymentList() {
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { canEdit } = usePermissions('/deployments');
    const [selectedDeployment, setSelectedDeployment] = useState<any>(null);
    const [newObservation, setNewObservation] = useState('');

    const { data: deployments, isLoading } = useQuery({
        queryKey: ['deployments'],
        queryFn: deploymentService.findAll,
    });

    const deleteMutation = useMutation({
        mutationFn: deploymentService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deployments'] });
            setSelectedDeployment(null);
            toast({ title: 'Sucesso', description: 'Implantação excluída.' });
        },
        onError: () => {
            toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' });
        }
    });

    const addHistoryMutation = useMutation({
        mutationFn: (data: { id: string; action: string; details: string }) =>
            deploymentService.addHistory(data.id, { action: data.action, details: data.details }),
        onSuccess: (newHistoryEntry) => {
            queryClient.invalidateQueries({ queryKey: ['deployments'] });
            setSelectedDeployment((prev: any) => ({
                ...prev,
                history: [newHistoryEntry, ...(prev?.history || [])]
            }));
            setNewObservation('');
            toast({ title: 'Sucesso', description: 'Observação adicionada.' });
        },
        onError: () => {
            toast({ title: 'Erro', description: 'Não foi possível adicionar a observação.', variant: 'destructive' });
        }
    });

    const handleAddObservation = () => {
        if (!newObservation.trim()) return;
        addHistoryMutation.mutate({
            id: selectedDeployment.id,
            action: 'Observação',
            details: newObservation.trim()
        });
    };

    const filtered = deployments?.filter(dep =>
        (dep.client?.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (dep.implantador?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    );

    const activeDeployment = selectedDeployment ? (deployments?.find(d => d.id === selectedDeployment.id) || selectedDeployment) : null;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight group flex items-center gap-3">
                            <MapIcon className="w-8 h-8 text-orange-600 group-hover:rotate-12 transition-transform" />
                            Guia de Implantação
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            Gerencie e acompanhe as implantações de clientes.
                        </p>
                    </div>

                    {canEdit && (
                        <Button onClick={() => navigate('/deployments/new')} className="gap-2 shrink-0 gradient-primary">
                            <Plus className="w-4 h-4" /> Nova Implantação
                        </Button>
                    )}
                </div>

                <div className="bg-card border border-border rounded-md overflow-hidden">
                    <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por cliente ou implantador..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 rounded-full"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Implantador</TableHead>
                                    <TableHead>Data Previsão</TableHead>
                                    <TableHead>Status</TableHead>
                                    {canEdit && <TableHead className="w-[100px] text-right">Ações</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-[100px] rounded-full" /></TableCell>
                                            {canEdit && <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>}
                                        </TableRow>
                                    ))
                                ) : filtered?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={canEdit ? 5 : 4} className="h-32 text-center text-muted-foreground">
                                            Nenhuma implantação encontrada. {searchTerm && 'Tente outro termo na busca.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered?.map((dep) => (
                                        <TableRow key={dep.id} className="group cursor-pointer" onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('.action-button')) return;
                                            setSelectedDeployment(dep);
                                        }}>
                                            <TableCell className="font-medium text-foreground">
                                                <div
                                                    className="inline-flex items-center gap-2 cursor-pointer hover:bg-muted p-1.5 -ml-1.5 rounded-md transition-colors hover:underline text-primary action-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedDeployment(dep);
                                                    }}
                                                >
                                                    {dep.client?.nomeFantasia || 'Cliente não encontrado'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {dep.implantador || <span className="text-muted-foreground italic">Não atribuído</span>}
                                            </TableCell>
                                            <TableCell>
                                                {dep.dataPrevisao ? (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                        {format(new Date(dep.dataPrevisao), "dd/MM/yyyy", { locale: ptBR })}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic">Sem previsão</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={DeploymentStatusColors[dep.status] + " border-0 rounded-full px-3 py-1 font-medium"}>
                                                    {DeploymentStatusLabels[dep.status]}
                                                </Badge>
                                            </TableCell>
                                            {canEdit && (
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 action-button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/deployments/${dep.id}`);
                                                            }}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 action-button"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Excluir implantação?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a ficha de implantação deste cliente.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        className="bg-destructive hover:bg-destructive/90"
                                                                        onClick={() => deleteMutation.mutate(dep.id)}
                                                                    >
                                                                        Excluir
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Modal de Detalhes da Implantação */}
            <Dialog open={!!selectedDeployment} onOpenChange={(open) => !open && setSelectedDeployment(null)}>
                <DialogContent className="sm:max-w-xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                    <DialogHeader className="px-6 pt-6 pb-2 border-b">
                        <DialogTitle>Detalhes da Implantação</DialogTitle>
                        <DialogDescription>
                            Abaixo estão os dados rápidos desta implantação, o histórico de andamento e acesso ao Drive do cliente.
                        </DialogDescription>
                    </DialogHeader>

                    {activeDeployment && (
                        <>
                            <div className="flex-1 px-6 overflow-y-auto min-h-0">
                                <div className="space-y-6 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold text-muted-foreground">Cliente</span>
                                            <span className="text-base font-medium">{activeDeployment.client?.nomeFantasia || 'N/A'}</span>
                                            <span className="text-xs text-muted-foreground">CNPJ: {activeDeployment.client?.cnpj || 'N/A'}</span>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold text-muted-foreground">Implantador</span>
                                            <span className="text-base font-medium">{activeDeployment.implantador || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold text-muted-foreground">Datas</span>
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Início: </span>
                                                {activeDeployment.dataInicio ? format(new Date(activeDeployment.dataInicio), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Previsão: </span>
                                                {activeDeployment.dataPrevisao ? format(new Date(activeDeployment.dataPrevisao), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold text-muted-foreground">Status Atual</span>
                                            <div>
                                                <Badge variant="outline" className={DeploymentStatusColors[activeDeployment.status as keyof typeof DeploymentStatusColors] + " mt-1"}>
                                                    {DeploymentStatusLabels[activeDeployment.status as keyof typeof DeploymentStatusLabels]}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {activeDeployment.observacao && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold text-muted-foreground">Observação Geral / Escopo</span>
                                            <div className="text-sm bg-slate-50 p-3 rounded-md border text-slate-700 whitespace-pre-wrap">
                                                {activeDeployment.observacao}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2 pt-2 border-t">
                                        <span className="text-sm font-semibold text-muted-foreground">Documentação / Arquivos (Drive)</span>
                                        {(activeDeployment.driveDocumentacao || activeDeployment.client?.driveLink) ? (
                                            <a
                                                href={activeDeployment.driveDocumentacao || activeDeployment.client?.driveLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex w-full"
                                            >
                                                <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 h-10">
                                                    Acessar Google Drive
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </a>
                                        ) : (
                                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-center text-slate-500 italic">
                                                Nenhum link de Drive foi cadastrado para essa implantação ou cliente ainda.
                                            </div>
                                        )}
                                    </div>

                                    {/* Sessão de Histórico */}
                                    <div className="flex flex-col gap-3 pt-4 border-t">
                                        <h3 className="text-base font-semibold text-slate-900">Histórico da Implantação</h3>

                                        {activeDeployment.history && activeDeployment.history.length > 0 ? (
                                            <div className="space-y-4">
                                                {activeDeployment.history.map((entry: any) => (
                                                    <div key={entry.id} className="relative pl-4 border-l-2 border-slate-200 pb-2">
                                                        <div className="absolute w-2.5 h-2.5 bg-blue-500 rounded-full -left-[6px] top-1.5 ring-4 ring-white" />
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-sm font-medium text-slate-800">{entry.action}</span>
                                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                                {format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                            </span>
                                                        </div>
                                                        {entry.user?.profile?.fullName && (
                                                            <div className="text-xs text-slate-500 font-medium mb-1">
                                                                Por: {entry.user.profile.fullName}
                                                            </div>
                                                        )}
                                                        {entry.details && (
                                                            <div className="text-sm text-slate-600 mt-1.5 bg-slate-50 px-3 py-2 rounded-md border">
                                                                {entry.details}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-slate-500 italic py-2 text-center bg-slate-50 rounded-md border">
                                                Nenhum histórico registrado ainda.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Input para Nova Observação */}
                            {canEdit && (
                                <div className="p-4 bg-slate-50 border-t flex flex-col gap-2 shrink-0">
                                    <span className="text-sm font-medium text-slate-700">Adicionar Observação ao Histórico</span>
                                    <div className="flex gap-2 items-start">
                                        <Textarea
                                            placeholder="Digite uma observação sobre o andamento..."
                                            value={newObservation}
                                            onChange={(e) => setNewObservation(e.target.value)}
                                            className="min-h-[60px] resize-none focus-visible:ring-blue-500 bg-white"
                                        />
                                        <Button
                                            onClick={handleAddObservation}
                                            disabled={!newObservation.trim() || addHistoryMutation.isPending}
                                            className="bg-blue-600 hover:bg-blue-700 h-[60px]"
                                        >
                                            {addHistoryMutation.isPending ? 'Enviando...' : 'Adicionar'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>

        </DashboardLayout>
    );
}

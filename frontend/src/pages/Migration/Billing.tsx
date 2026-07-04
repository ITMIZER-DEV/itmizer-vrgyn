import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { migrationService, Migration } from '@/services/migrationService';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { FileDown, Wallet, Eye, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Billing() {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedMigration, setSelectedMigration] = useState<Migration | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    // Estado do Estorno
    const [chargebackOpen, setChargebackOpen] = useState(false);
    const [chargebackData, setChargebackData] = useState({ password: '', reason: '' });

    const queryClient = useQueryClient();

    const { data: migrations, isLoading } = useQuery({
        queryKey: ['migrations'],
        queryFn: migrationService.findAll,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, statusFinanceiro }: { id: string; statusFinanceiro: string }) =>
            migrationService.update(id, { statusFinanceiro }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['migrations'] });
            setSelectedMigration(prev => prev ? { ...prev, statusFinanceiro: 'pago' } : null);
        }
    });

    const chargebackMutation = useMutation({
        mutationFn: (data: { password: string; reason: string }) => {
            if (!selectedMigration) throw new Error('Nenhuma migração selecionada');
            return migrationService.chargeback(selectedMigration.id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['migrations'] });
            setSelectedMigration(prev => prev ? { ...prev, statusFinanceiro: 'pendente' } : null);
            setChargebackOpen(false);
            setChargebackData({ password: '', reason: '' });
            alert('Estorno realizado com sucesso!');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Erro ao realizar estorno');
        }
    });

    const calculatePredicted = (migration: Migration) => {
        if (migration.tipoCobranca === 'valor_fixo') {
            return Number(migration.valorFixo) || 0;
        }

        // Por hora: calcula baseado na estimativa dos itens
        let horasEstimadas = 0;
        if (migration.items) {
            Object.values(migration.items).forEach((item: any) => {
                if (item.migrar && item.tempoEstimado) {
                    horasEstimadas += parseInt(item.tempoEstimado) || 0;
                }
            });
        }
        return horasEstimadas * (Number(migration.valorHora) || 0);
    };

    const calculateEffective = (migration: Migration) => {
        if (migration.tipoCobranca === 'valor_fixo') {
            const fixo = Number(migration.valorFixo) || 0;
            const extras = migration.lancamentos?.reduce((acc, l) => acc + (Number(l.valor) || 0), 0) || 0;
            return fixo + extras;
        }

        // Por hora: soma lançamentos reais
        const horasLancadas = migration.lancamentos?.reduce((acc, l) => acc + (Number(l.horas) || 0), 0) || 0;
        return horasLancadas * (Number(migration.valorHora) || 0);
    };

    // Filtra migrações
    const filteredMigrations = migrations?.filter(m => {
        if (statusFilter !== 'all' && m.status !== statusFilter) return false;
        return true;
    }) || [];

    const totalPrevistoGeral = filteredMigrations.reduce((acc, m) => acc + calculatePredicted(m), 0);
    const totalEfetivoGeral = filteredMigrations.filter(m => m.status === 'concluida').reduce((acc, m) => acc + calculateEffective(m), 0);
    const totalPagoGeral = filteredMigrations.filter(m => m.statusFinanceiro === 'pago').reduce((acc, m) => acc + calculateEffective(m), 0);

    const generateReport = () => {
        const doc = new jsPDF();
        doc.text('Relatório de Faturamento de Migrações', 14, 15);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 22);

        const data = filteredMigrations.map(m => [
            m.client?.nomeFantasia || 'Cliente Removido',
            m.status,
            m.statusFinanceiro || 'pendente',
            `R$ ${calculatePredicted(m).toFixed(2)}`,
            `R$ ${calculateEffective(m).toFixed(2)}`
        ]);

        autoTable(doc, {
            head: [['Cliente', 'Status', 'Financeiro', 'Previsto', 'Efetivo']],
            body: data,
            startY: 30,
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text(`Total Previsto: R$ ${totalPrevistoGeral.toFixed(2)}`, 14, finalY);
        doc.text(`Total Efetivo (Concluídas): R$ ${totalEfetivoGeral.toFixed(2)}`, 14, finalY + 7);
        doc.text(`Total Pago: R$ ${totalPagoGeral.toFixed(2)}`, 14, finalY + 14);

        doc.save('relatorio_faturamento_detalhado.pdf');
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pendente: 'bg-yellow-100 text-yellow-800',
            pago: 'bg-green-100 text-green-800',
            faturado: 'bg-blue-100 text-blue-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
                {status?.toUpperCase() || 'PENDENTE'}
            </span>
        );
    };

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold font-display flex items-center gap-2">
                        <Wallet className="w-8 h-8 text-primary" />
                        Controle de Faturamento
                    </h1>
                    <p className="text-muted-foreground">Gestão financeira e faturamento de migrações</p>
                </div>
                <Button onClick={generateReport} className="gap-2">
                    <FileDown className="w-4 h-4" />
                    Exportar PDF
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Previsto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">R$ {totalPrevistoGeral.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Baseado na estimativa de horas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Efetivo (Concluídas)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">R$ {totalEfetivoGeral.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Baseado nos apontamentos reais</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">R$ {totalPagoGeral.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Migrações com status 'Pago'</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Migrações</CardTitle>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                <SelectItem value="pendente">Pendente</SelectItem>
                                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                                <SelectItem value="concluida">Concluída</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Finaneiro</TableHead>
                                <TableHead className="text-right">Previsto</TableHead>
                                <TableHead className="text-right">Efetivo</TableHead>
                                <TableHead className="text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMigrations.map((migration) => (
                                <TableRow key={migration.id}>
                                    <TableCell className="font-medium">{migration.client?.nomeFantasia || 'Cliente Removido'}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
                                            {migration.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(migration.statusFinanceiro || 'pendente')}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        R$ {calculatePredicted(migration).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        R$ {calculateEffective(migration).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedMigration(migration);
                                                setDetailsOpen(true);
                                            }}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            Detalhes
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal de Detalhes */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes Financeiros - {selectedMigration?.client?.nomeFantasia}</DialogTitle>
                    </DialogHeader>

                    {selectedMigration && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-gray-50">
                                    <span className="text-sm text-muted-foreground block">Total Previsto</span>
                                    <span className="text-xl font-bold">R$ {calculatePredicted(selectedMigration).toFixed(2)}</span>
                                </div>
                                <div className="p-4 rounded-lg bg-green-50">
                                    <span className="text-sm text-green-700 block">Total Efetivo</span>
                                    <span className="text-xl font-bold text-green-700">R$ {calculateEffective(selectedMigration).toFixed(2)}</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-medium mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Extrato de Lançamentos
                                </h3>
                                <div className="border rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Data</TableHead>
                                                <TableHead>Técnico</TableHead>
                                                <TableHead>Descrição</TableHead>
                                                <TableHead className="text-right">Qtd/Valor</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedMigration.lancamentos?.length ? (
                                                selectedMigration.lancamentos.map((l) => (
                                                    <TableRow key={l.id}>
                                                        <TableCell>{format(new Date(l.data), 'dd/MM/yyyy')}</TableCell>
                                                        <TableCell>{l.user?.profile?.fullName || '-'}</TableCell>
                                                        <TableCell>{l.descricao || '-'}</TableCell>
                                                        <TableCell className="text-right">
                                                            {l.horas ? `${l.horas}h` : `R$ ${l.valor}`}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                                        Nenhum lançamento registrado.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <DialogFooter className="sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Status Atual:</span>
                                    {getStatusBadge(selectedMigration.statusFinanceiro || 'pendente')}
                                </div>
                                <div className="flex gap-2">
                                    {selectedMigration.statusFinanceiro !== 'pago' ? (
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => updateStatusMutation.mutate({
                                                id: selectedMigration.id,
                                                statusFinanceiro: 'pago'
                                            })}
                                            disabled={updateStatusMutation.isPending}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Marcar como Pago
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="destructive"
                                            onClick={() => setChargebackOpen(true)}
                                        >
                                            <AlertCircle className="w-4 h-4 mr-2" />
                                            Estornar Pagamento
                                        </Button>
                                    )}
                                </div>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={chargebackOpen} onOpenChange={setChargebackOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Estorno</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Motivo do Estorno (Obrigatório)</Label>
                            <Input
                                placeholder="Descreva o motivo..."
                                value={chargebackData.reason}
                                onChange={e => setChargebackData({ ...chargebackData, reason: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Senha de Administrador</Label>
                            <Input
                                type="password"
                                placeholder="Sua senha para confirmar..."
                                value={chargebackData.password}
                                onChange={e => setChargebackData({ ...chargebackData, password: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setChargebackOpen(false)}>Cancelar</Button>
                        <Button
                            variant="destructive"
                            onClick={() => chargebackMutation.mutate(chargebackData)}
                            disabled={chargebackMutation.isPending || !chargebackData.reason || !chargebackData.password}
                        >
                            {chargebackMutation.isPending ? 'Estornando...' : 'Confirmar Estorno'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { migrationService, Migration, MigrationStatus, MigrationStatusLabels, MigrationStatusColors } from '@/services/migrationService';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, FileText, CheckCircle, Clock, Search, ExternalLink } from 'lucide-react';
import { startOfMonth, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const statusFilters: { label: string; value: MigrationStatus | 'all' }[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Pendente', value: 'pendente' },
    { label: 'Em Validação', value: 'em_validacao' },
    { label: 'Em Andamento', value: 'em_andamento' },
    { label: 'Concluída', value: 'concluida' },
    { label: 'Cancelada', value: 'cancelada' },
];

export default function Reports() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<MigrationStatus | 'all'>('all');

    const { data: migrations, isLoading } = useQuery({
        queryKey: ['migrations'],
        queryFn: migrationService.findAll,
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    const validMigrations = migrations || [];

    // --- KPI Calcs ---
    const totalMigrations = validMigrations.length;
    const completedMigrations = validMigrations.filter(m => m.status === 'concluida').length;

    const calculateEffective = (m: Migration) => {
        if (m.tipoCobranca === 'valor_fixo') {
            const fixo = Number(m.valorFixo) || 0;
            const extras = m.lancamentos?.reduce((acc, l) => acc + (Number(l.valor) || 0), 0) || 0;
            return fixo + extras;
        }
        const horasLancadas = m.lancamentos?.reduce((acc, l) => acc + (Number(l.horas) || 0), 0) || 0;
        return horasLancadas * (Number(m.valorHora) || 0);
    };

    const totalRevenue = validMigrations
        .filter(m => m.statusFinanceiro === 'pago')
        .reduce((acc, m) => acc + calculateEffective(m), 0);

    const pendingRevenue = validMigrations
        .filter(m => m.statusFinanceiro !== 'pago' && m.status !== 'cancelada')
        .reduce((acc, m) => acc + calculateEffective(m), 0);

    // --- Charts Calcs ---

    // 1. Status Distribution
    const statusCount = validMigrations.reduce((acc, m) => {
        acc[m.status] = (acc[m.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusCount).map(([name, value]) => ({ name: name.replace('_', ' ').toUpperCase(), value }));
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    // 2. Revenue by Month (Last 6 months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return {
            key: format(d, 'MMM/yyyy', { locale: ptBR }),
            date: d,
            total: 0
        };
    });

    validMigrations.forEach(m => {
        const mDate = parseISO(m.createdAt);
        const mKey = format(mDate, 'MMM/yyyy', { locale: ptBR });
        const bucket = last6Months.find(b => b.key === mKey);
        if (bucket) {
            bucket.total += calculateEffective(m);
        }
    });

    // 3. Top 5 Clients by Revenue
    const topClients = [...validMigrations]
        .map(m => ({
            name: m.client?.nomeFantasia || 'N/A',
            value: calculateEffective(m)
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // --- Table Filtering ---
    const filtered = validMigrations.filter(m => {
        const matchesSearch =
            m.client?.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.client?.cnpj?.includes(searchTerm) ||
            m.nomeSistema?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const formatCurrency = (value: number) =>
        value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold font-display">Relatórios de Migração</h1>
                    <p className="text-muted-foreground">Visão geral dos indicadores de performance e financeiro.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Migrações</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalMigrations}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{completedMigrations}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Receita Efetiva</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pendente Recebimento</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingRevenue)}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Status Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Distribuição por Status</CardTitle>
                            <CardDescription>Volume de migrações por etapa atual</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Revenue Trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tendência de Receita (Últimos 6 meses)</CardTitle>
                            <CardDescription>Valor total de migrações iniciadas por mês</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={last6Months}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="key" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                    <Bar dataKey="total" fill="#3b82f6" name="Receita" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Clients */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Clientes por Receita</CardTitle>
                        <CardDescription>Clientes com maior valor efetivo de migração</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topClients.map((client, i) => (
                                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                                            {i + 1}
                                        </div>
                                        <span className="font-medium">{client.name}</span>
                                    </div>
                                    <span className="font-bold">{formatCurrency(client.value)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Migration List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Lista Detalhada de Migrações</CardTitle>
                        <CardDescription>Consulte e acesse individualmente cada migração cadastrada</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por cliente, CNPJ ou sistema..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {statusFilters.map(f => (
                                    <Button
                                        key={f.value}
                                        variant={statusFilter === f.value ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setStatusFilter(f.value)}
                                    >
                                        {f.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Sistema Atual</TableHead>
                                        <TableHead>Responsável</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Valor Efetivo</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead className="text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                                Nenhuma migração encontrada.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filtered.map((migration) => (
                                            <TableRow
                                                key={migration.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => navigate(`/migration/${migration.id}`)}
                                            >
                                                <TableCell className="font-medium">
                                                    <div>
                                                        <div>{migration.client?.nomeFantasia || '-'}</div>
                                                        <div className="text-xs text-muted-foreground">{migration.client?.cnpj || '-'}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{migration.nomeSistema || '-'}</TableCell>
                                                <TableCell>
                                                    {migration.responsavel?.profile?.fullName || migration.responsavel?.email || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={MigrationStatusColors[migration.status]}>
                                                        {MigrationStatusLabels[migration.status]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {formatCurrency(calculateEffective(migration))}
                                                </TableCell>
                                                <TableCell>{formatDate(migration.createdAt)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/migration/${migration.id}`);
                                                        }}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        Abrir
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Exibindo {filtered.length} de {totalMigrations} migrações
                        </p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

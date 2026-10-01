import { useState, useEffect, Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
    migrationService, Migration, MigrationStatus, MigrationStatusLabels,
    MigrationStatusColors, MigrationItems, defaultMigrationItems, MigrationHistoryEntry
} from '@/services/migrationService';
import { clientService, Client } from '@/services/clientService';
import { userService, User } from '@/services/userService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronUp, FileText,
    History, Monitor, Box, Key, Phone, Database, User as UserIcon, Calendar, Wallet,
    Loader2, Building2, Package, Users, ShoppingCart, AlertCircle, Clock, Send, BarChart3, FileDown, Scale,
    CalendarDays, CalendarCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const NON_IMPORTED_ITEMS = [
    'Pedido de compras', 'Histórico de compras', 'Notas de entrada e saída',
    'Desmembramento', 'Plano de contas', 'Extrato de movimentação', 'Validade de Produto'
];

interface MigrationItemRowProps {
    label: string;
    itemKey: string;
    items: MigrationItems;
    setItems: (items: MigrationItems) => void;
    subQuestions?: { key: string; label: string }[];
    isReadOnly?: boolean;
}

function MigrationItemRow({ label, itemKey, items, setItems, subQuestions, isReadOnly }: MigrationItemRowProps) {
    const item = (items as any)[itemKey];
    const updateItem = (field: string, value: any) => {
        setItems({ ...items, [itemKey]: { ...item, [field]: value } });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            updateItem('anexo', file.name);
        }
    };

    return (
        <div className={`p-5 rounded-xl border transition-all duration-300 backdrop-blur-sm ${
            item.migrar 
                ? 'border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 shadow-md shadow-primary/5 dark:shadow-none' 
                : 'border-border bg-card/40 hover:bg-card/70 hover:border-muted-foreground/30'
        }`}>
            <div className="flex items-start gap-4">
                <Checkbox
                    checked={item.migrar}
                    onCheckedChange={(checked) => updateItem('migrar', !!checked)}
                    className="mt-1 h-5 w-5 rounded border-primary/50 text-primary focus:ring-primary/30"
                    disabled={isReadOnly}
                />
                <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <Label className="font-semibold text-base cursor-pointer tracking-tight text-foreground/90 select-none" onClick={() => !isReadOnly && updateItem('migrar', !item.migrar)}>
                            {label}
                        </Label>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/80 text-xs font-semibold text-muted-foreground shrink-0">
                            <Clock className="w-3.5 h-3.5 text-primary/70" />
                            {item.tempoEstimado}
                        </div>
                    </div>

                    {item.migrar && (
                        <div className="space-y-4 pt-2 border-t border-primary/10 animate-in fade-in slide-in-from-top-2 duration-200">
                            {subQuestions && subQuestions.length > 0 && (
                                <div className="grid gap-2.5 sm:grid-cols-2 p-3 rounded-lg bg-muted/30">
                                    {subQuestions.map(sq => (
                                        <div key={sq.key} className="flex items-center gap-2.5">
                                            <Checkbox
                                                checked={item[sq.key] || false}
                                                onCheckedChange={(checked) => updateItem(sq.key, !!checked)}
                                                disabled={isReadOnly}
                                                className="rounded border-muted-foreground/45"
                                            />
                                            <Label className="text-sm cursor-pointer select-none text-foreground/80 hover:text-foreground" onClick={() => !isReadOnly && updateItem(sq.key, !item[sq.key])}>
                                                {sq.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Textarea
                                placeholder="Observações..."
                                value={item.observacoes}
                                onChange={(e) => updateItem('observacoes', e.target.value)}
                                rows={2}
                                className="text-sm bg-background/50 border-input/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                                disabled={isReadOnly}
                            />
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">Anexo</Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="text-xs bg-background/40 border-dashed border-input/80 hover:border-primary/45 cursor-pointer max-w-xs"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                                        disabled={isReadOnly}
                                    />
                                    {item.anexo && (
                                        <span className="text-xs font-medium px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                            📎 {item.anexo}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { usePermissions } from '@/hooks/usePermissions';

interface MigrationFormProps {
    migrationId?: string;
    embedded?: boolean;
    onBack?: () => void;
}

export default function MigrationForm({ migrationId, embedded, onBack }: MigrationFormProps = {}) {
    const params = useParams();
    const id = migrationId ?? params.id;
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isEditing = !!id;
    const { canEdit } = usePermissions('/migration');
    const isReadOnly = !canEdit;
    const goBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('/migration');
        }
    };
    const Wrapper = embedded ? Fragment : DashboardLayout;

    const [clientId, setClientId] = useState('');
    const [status, setStatus] = useState<MigrationStatus>('pendente');
    const [responsavelId, setResponsavelId] = useState('');
    const [tipoCobranca, setTipoCobranca] = useState<'hora' | 'valor_fixo'>('hora');
    const [valorHora, setValorHora] = useState('');
    const [valorFixo, setValorFixo] = useState('');
    const [nomeContatoChave, setNomeContatoChave] = useState('');
    const [telefone, setTelefone] = useState('');
    const [acessoAnydesk, setAcessoAnydesk] = useState('');
    const [senhaAnydesk, setSenhaAnydesk] = useState('');
    const [nomeSistema, setNomeSistema] = useState('');
    const [nomeSoftwareHouse, setNomeSoftwareHouse] = useState('');
    const [tipoBancoDados, setTipoBancoDados] = useState('');
    const [items, setItems] = useState<MigrationItems>(defaultMigrationItems);
    const [observacoes, setObservacoes] = useState('');
    const [dataPrevistaVirada, setDataPrevistaVirada] = useState('');
    const [dataViradaSistema, setDataViradaSistema] = useState('');
    const [tipoMigracao, setTipoMigracao] = useState<'padrao' | 'planilha' | 'consultoria'>('padrao');
    const [isSaving, setIsSaving] = useState(false);
    const [historyAction, setHistoryAction] = useState('');
    const [historyDetails, setHistoryDetails] = useState('');
    const [historyData, setHistoryData] = useState<MigrationHistoryEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Estados para controle financeiro
    const [users, setUsers] = useState<User[]>([]);
    const [lancamentos, setLancamentos] = useState<any[]>([]);
    const [novoLancamento, setNovoLancamento] = useState({ data: '', hours: '', valor: '', descricao: '' });

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: clientService.findAll,
    });

    const { data: usersList } = useQuery({
        queryKey: ['users'],
        queryFn: userService.findAll,
    });

    useEffect(() => {
        if (usersList) {
            setUsers(usersList);
        }
    }, [usersList]);

    const { data: migration, isLoading } = useQuery({
        queryKey: ['migration', id],
        queryFn: () => migrationService.findOne(id!),
        enabled: isEditing,
    });

    useEffect(() => {
        if (migration) {
            setClientId(migration.clientId);
            setStatus(migration.status);

            let loadedTipo = (migration.tipoMigracao as string) || 'padrao';
            if (loadedTipo === 'padrao_bd') loadedTipo = 'padrao';
            if (loadedTipo === 'planilhas') loadedTipo = 'planilha';
            setTipoMigracao(loadedTipo as 'padrao' | 'planilha' | 'consultoria');

            setResponsavelId(migration.responsavelId || '');
            setTipoCobranca(migration.tipoCobranca || 'hora');
            setValorHora(migration.valorHora?.toString() || '');
            setValorFixo(migration.valorFixo?.toString() || '');
            setNomeContatoChave(migration.nomeContatoChave || '');
            setTelefone(migration.telefone || '');
            setAcessoAnydesk(migration.acessoAnydesk || '');
            setSenhaAnydesk(migration.senhaAnydesk || '');
            setNomeSistema(migration.nomeSistema || '');
            setNomeSoftwareHouse(migration.nomeSoftwareHouse || '');
            setTipoBancoDados(migration.tipoBancoDados || '');

            const fetchedItems = migration.items as any;
            const deeplyMergedItems = { ...defaultMigrationItems };
            if (fetchedItems && typeof fetchedItems === 'object') {
                for (const key of Object.keys(defaultMigrationItems) as (keyof typeof defaultMigrationItems)[]) {
                    if (fetchedItems[key]) {
                        (deeplyMergedItems as any)[key] = { ...defaultMigrationItems[key], ...fetchedItems[key] };
                    }
                }
                // Maintain period fields if they exist at root of items
                if (fetchedItems.produtoPeriodo) (deeplyMergedItems as any).produtoPeriodo = fetchedItems.produtoPeriodo;
                if (fetchedItems.vendasPeriodo) (deeplyMergedItems as any).vendasPeriodo = fetchedItems.vendasPeriodo;
            }
            setItems(deeplyMergedItems);

            setObservacoes(migration.observacoes || '');
            setDataPrevistaVirada(migration.dataPrevistaVirada ? migration.dataPrevistaVirada.split('T')[0] : '');
            setDataViradaSistema(migration.dataViradaSistema ? migration.dataViradaSistema.split('T')[0] : '');
            if (migration.lancamentos) {
                setLancamentos(migration.lancamentos);
            }
        }
    }, [migration]);

    const loadHistory = async () => {
        if (!id) return;
        setHistoryLoading(true);
        try {
            const data = await migrationService.getHistory(id);
            setHistoryData(data);
        } catch (error) {
            console.error('Erro ao carregar histórico', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (isEditing) {
            loadHistory();
        }
    }, [id]);

    const handleSave = async () => {

        if (!clientId) {
            toast({ title: 'Erro', description: 'Selecione um cliente.', variant: 'destructive' });
            return;
        }
        try {
            setIsSaving(true);
            const payload = {
                clientId, status, tipoMigracao,
                responsavelId: responsavelId || null,
                tipoCobranca,
                valorHora: valorHora ? parseFloat(valorHora) : undefined,
                valorFixo: valorFixo ? parseFloat(valorFixo) : undefined,
                nomeContatoChave, telefone, acessoAnydesk,
                senhaAnydesk, nomeSistema, nomeSoftwareHouse, tipoBancoDados, items, observacoes,
                dataPrevistaVirada: dataPrevistaVirada || undefined,
                dataViradaSistema: dataViradaSistema || undefined,
            };
            if (isEditing) {
                await migrationService.update(id!, payload);
            } else {
                await migrationService.create(payload);
            }
            queryClient.invalidateQueries({ queryKey: ['migrations'] });
            toast({ title: 'Sucesso', description: `Migração ${isEditing ? 'atualizada' : 'criada'} com sucesso.` });
            goBack();
        } catch {
            toast({ title: 'Erro', description: 'Falha ao salvar migração.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddLancamento = async () => {
        if (!novoLancamento.data || (!novoLancamento.hours && !novoLancamento.valor)) {
            toast({ title: 'Erro', description: 'Preencha a data e horas ou valor.', variant: 'destructive' });
            return;
        }
        try {
            await migrationService.addLancamento(id!, {
                data: novoLancamento.data,
                horas: novoLancamento.hours ? parseFloat(novoLancamento.hours) : undefined,
                valor: novoLancamento.valor ? parseFloat(novoLancamento.valor) : undefined,
                descricao: novoLancamento.descricao
            });
            queryClient.invalidateQueries({ queryKey: ['migration', id] });
            setNovoLancamento({ data: '', hours: '', valor: '', descricao: '' });
            toast({ title: 'Sucesso', description: 'Lançamento adicionado com sucesso.' });
        } catch {
            toast({ title: 'Erro', description: 'Erro ao adicionar lançamento.', variant: 'destructive' });
        }
    };

    const addHistoryMutation = useMutation({
        mutationFn: () => migrationService.addHistory(id!, { action: historyAction, details: historyDetails }),
        onSuccess: () => {
            loadHistory(); // Refresh history
            setHistoryAction('');
            setHistoryDetails('');
            toast({ title: 'Histórico adicionado' });
        },
    });

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    // Calcula o total de horas dos itens marcados para migrar
    const calculateTotalHours = () => {
        let totalHours = 0;
        Object.entries(items).forEach(([key, item]) => {
            if (item.migrar) {
                const hours = parseInt(item.tempoEstimado) || 0;
                totalHours += hours;
            }
        });
        return totalHours;
    };

    const generatePDF = () => {
        if (!migration) {
            toast({ title: 'Erro', description: 'Dados da migração não carregados.', variant: 'destructive' });
            return;
        }

        const doc = new jsPDF();
        const clientName = migration.client?.nomeFantasia || 'Cliente Desconhecido';
        const clientCnpj = migration.client?.cnpj || '';
        let y = 15;

        // Título
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Aderência de Migração', 105, y, { align: 'center' });
        y += 12;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Cliente: ${clientName}`, 14, y);
        doc.text(`CNPJ: ${clientCnpj}`, 120, y);
        y += 6;
        doc.text(`Status: ${MigrationStatusLabels[migration.status]}`, 14, y);
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 120, y);
        y += 6;
        doc.text(`Tipo: ${migration.tipoMigracao === 'planilha' ? 'Por Planilha' : 'Padrão'}`, 14, y);
        if (migration.responsavel) {
            doc.text(`Responsável: ${migration.responsavel.profile?.fullName || migration.responsavel.email}`, 120, y);
        }
        y += 10;

        // Acessos/Contato
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Acessos / Contato', 14, y);
        y += 2;

        autoTable(doc, {
            startY: y,
            head: [['Campo', 'Valor']],
            body: [
                ['Nome do Contato Chave', nomeContatoChave || '-'],
                ['Telefone', telefone || '-'],
                ['Acesso Anydesk', acessoAnydesk || '-'],
                ['Senha Anydesk', senhaAnydesk || '-'],
                ['Nome do Sistema', nomeSistema || '-'],
                ['Nome da Software House', nomeSoftwareHouse || '-'],
                ['Tipo do Banco de Dados', tipoBancoDados || '-'],
            ],
            theme: 'grid',
            headStyles: { fillColor: [234, 88, 12] },
            styles: { fontSize: 9 },
            margin: { left: 14, right: 14 },
        });
        y = doc.lastAutoTable.finalY + 10;

        // Itens de Migração
        const migrationItemsConfig: { section: string; key: string; label: string; subKeys?: { key: string; label: string }[] }[] = [
            { section: 'Produto', key: 'cadastroProduto', label: 'Cadastro de Produto', subKeys: [{ key: 'trabalhaAtacado', label: 'Trabalha com atacado' }, { key: 'trazerAtacadoAtual', label: 'Trazer atacado atual' }, { key: 'trabalhaPautaFiscal', label: 'Pauta fiscal' }] },
            { section: 'Produto', key: 'mercadologico', label: 'Mercadológico', subKeys: [{ key: 'contratouFerramenta', label: 'Contratou ferramenta' }, { key: 'usarPadraoVR', label: 'Usar padrão VR' }] },
            { section: 'Produto', key: 'familiaProdutos', label: 'Família de Produtos' },
            { section: 'Produto', key: 'produtoFornecedor', label: 'Produto Fornecedor' },
            { section: 'Produto', key: 'balanca', label: 'Balança', subKeys: [{ key: 'temArquivoBalanca', label: 'Tem arquivo de balança' }] },
            { section: 'Fornecedor', key: 'fornecedor', label: 'Cadastro de Fornecedor' },
            { section: 'Cliente', key: 'clientePreferencial', label: 'Cliente Preferencial' },
            { section: 'Convênio', key: 'convenio', label: 'Cadastro de Convênio' },
            { section: 'Financeiro', key: 'cheque', label: 'Cheque', subKeys: [{ key: 'controlaPeloSistema', label: 'Controla pelo sistema' }] },
            { section: 'Financeiro', key: 'creditoRotativo', label: 'Crédito Rotativo', subKeys: [{ key: 'controlaPeloSistema', label: 'Controla pelo sistema' }] },
            { section: 'Financeiro', key: 'contasPagar', label: 'Contas a Pagar', subKeys: [{ key: 'controlaPeloSistema', label: 'Controla pelo sistema' }] },
            { section: 'Financeiro', key: 'contasReceberFornecedor', label: 'Contas a Receber Fornecedor', subKeys: [{ key: 'controlaPeloSistema', label: 'Controla pelo sistema' }] },
            { section: 'Financeiro', key: 'outrasDespesas', label: 'Outras Despesas', subKeys: [{ key: 'controlaPeloSistema', label: 'Controla pelo sistema' }] },
            { section: 'Fiscal', key: 'mapaTributacao', label: 'Mapa de Tributação' },
            { section: 'Histórico', key: 'historicoVendas', label: 'Histórico de Vendas' },
        ];

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Migração Padrão - Itens Selecionados', 14, y);
        y += 2;

        // Filtra apenas os itens que serão migrados
        const tableBody = migrationItemsConfig
            .filter(cfg => {
                const item = (items as any)[cfg.key];
                return item.migrar;
            })
            .map(cfg => {
                const item = (items as any)[cfg.key];
                const subInfo = cfg.subKeys?.filter(sk => item[sk.key]).map(sk => sk.label).join(', ') || '';
                return [
                    cfg.section,
                    cfg.label,
                    item.tempoEstimado,
                    subInfo,
                    item.observacoes || '',
                ];
            });

        // Verifica se há itens selecionados para mostrar na tabela
        if (tableBody.length > 0) {
            autoTable(doc, {
                startY: y,
                head: [['Seção', 'Item', 'Tempo', 'Detalhes', 'Observações']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235] },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: {
                    0: { cellWidth: 28 },
                    1: { cellWidth: 45 },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 45 },
                    4: { cellWidth: 44 },
                },
                margin: { left: 14, right: 14 },
            });
            y = doc.lastAutoTable.finalY + 6;
        } else {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(107, 114, 128);
            doc.text('Nenhum item selecionado para migração.', 14, y + 6);
            y += 16;
        }

        // Total de horas
        const totalHours = calculateTotalHours();
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(37, 99, 235);
        doc.setTextColor(255, 255, 255);
        doc.rect(14, y, 182, 8, 'F');
        doc.text(`TOTAL DE HORAS ESTIMADAS (itens marcados para migração): ${totalHours} horas`, 105, y + 5.5, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        y += 14;

        // Dados não importados
        if (y > 250) { doc.addPage(); y = 15; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text('Dados Não Importados', 14, y);
        doc.setTextColor(0, 0, 0);
        y += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        NON_IMPORTED_ITEMS.forEach(item => {
            doc.text(`• ${item}`, 18, y);
            y += 5;
        });
        y += 5;

        // Responsável Fiscal (se não migrar Mapa de Tributação)
        if (!items.mapaTributacao.migrar && items.mapaTributacao.empresaResponsavel) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(234, 88, 12); // Laranja
            doc.text(`Revisão Fiscal por: ${items.mapaTributacao.empresaResponsavel}`, 14, y);
            doc.setTextColor(0, 0, 0);
            y += 8;
        }

        // Observações
        if (observacoes) {
            if (y > 260) { doc.addPage(); y = 15; }
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('Observações Gerais', 14, y);
            y += 6;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(observacoes, 180);
            doc.text(lines, 14, y);
            y += lines.length * 4 + 8;
        }

        // Histórico
        if (migration?.history && migration.history.length > 0) {
            if (y > 230) { doc.addPage(); y = 15; }
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('Histórico da Migração', 14, y);
            y += 2;

            autoTable(doc, {
                startY: y,
                head: [['Data', 'Usuário', 'Ação', 'Detalhes']],
                body: migration.history.map(h => [
                    formatDateTime(h.createdAt),
                    h.user?.profile?.fullName || h.user?.email || '-',
                    h.action,
                    h.details || '',
                ]),
                theme: 'grid',
                headStyles: { fillColor: [107, 114, 128] },
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    overflow: 'linebreak',
                },
                columnStyles: {
                    0: { cellWidth: 32 },
                    1: { cellWidth: 38 },
                    2: { cellWidth: 38 },
                    3: { cellWidth: 'auto', overflow: 'linebreak' },
                },
                margin: { left: 14, right: 14 },
            });
        }

        doc.save(`migracao_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    if (isEditing && isLoading) {
        return (
            <Wrapper>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    {!embedded && (
                        <Button variant="ghost" size="icon" onClick={goBack}>
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold font-display">
                            {isEditing ? (isReadOnly ? 'Detalhes da Migração' : 'Editar Migração') : 'Nova Migração'}
                        </h1>
                        <p className="text-muted-foreground">Aderência de Migração</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isEditing && (
                        <Button variant="outline" onClick={generatePDF} className="gap-2">
                            <FileDown className="w-4 h-4" />
                            Gerar PDF
                        </Button>
                    )}
                    {!isReadOnly && (
                        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6">
                {/* Card de Progresso e Resumo com Glassmorphism e gradiente */}
                <Card className="border border-primary/20 backdrop-blur-md bg-gradient-to-r from-primary/5 via-background/40 to-emerald-500/5 shadow-lg relative overflow-hidden transition-all duration-300">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
                    <CardContent className="pt-6 relative z-10 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center shadow-md shadow-primary/20">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Tempo Estimado da Virada</p>
                                    <p className="text-3xl font-extrabold text-foreground">{calculateTotalHours()} horas</p>
                                </div>
                            </div>
                            <div className="sm:text-right">
                                <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Aderência do Plano</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {Object.values(items).filter(item => item.migrar).length} <span className="text-sm font-normal text-muted-foreground">de</span> {Object.keys(items).length} <span className="text-sm font-normal text-muted-foreground">itens mapeados</span>
                                </p>
                            </div>
                        </div>

                        {/* Barra de Progresso Estilizada */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm font-medium">
                                <span className="text-muted-foreground">Conclusão do Plano</span>
                                <span className="text-emerald-500 dark:text-emerald-400 font-bold">
                                    {Object.keys(items).length > 0 ? Math.round((Object.values(items).filter(item => item.migrar).length / Object.keys(items).length) * 100) : 0}%
                                </span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-muted/60 overflow-hidden p-0.5 border border-muted-foreground/10">
                                <div 
                                    className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500 ease-out shadow-sm"
                                    style={{ width: `${Object.keys(items).length > 0 ? Math.round((Object.values(items).filter(item => item.migrar).length / Object.keys(items).length) * 100) : 0}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Card 1 - Dados Gerais */}
                <Card>
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            <CardTitle>Dados Gerais</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Cliente *</Label>
                                <Select value={clientId} onValueChange={setClientId} disabled={isEditing || isReadOnly}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients?.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.nomeFantasia} - {c.cnpj}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={status} onValueChange={(v) => setStatus(v as MigrationStatus)} disabled={isReadOnly}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(MigrationStatusLabels).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de Migração</Label>
                                <Select value={tipoMigracao} onValueChange={(v) => setTipoMigracao(v as 'padrao' | 'planilha' | 'consultoria')} disabled={isReadOnly}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="padrao">Migração Padrão</SelectItem>
                                        <SelectItem value="planilha">Por Planilha</SelectItem>
                                        <SelectItem value="consultoria">Consultoria</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Responsável</Label>
                                <Select value={responsavelId} onValueChange={setResponsavelId} disabled={isReadOnly}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o responsável" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map(u => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {u.profile?.fullName || u.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de Cobrança</Label>
                                <Select value={tipoCobranca} onValueChange={(v) => setTipoCobranca(v as 'hora' | 'valor_fixo')} disabled={isReadOnly}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hora">Por Hora</SelectItem>
                                        <SelectItem value="valor_fixo">Valor Fixo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {tipoCobranca === 'hora' ? (
                                <div className="space-y-2">
                                    <Label>Valor Hora (R$)</Label>
                                    <Input
                                        type="number"
                                        value={valorHora}
                                        onChange={e => setValorHora(e.target.value)}
                                        placeholder="0.00"
                                        disabled={isReadOnly}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Valor Fixo (R$)</Label>
                                    <Input
                                        type="number"
                                        value={valorFixo}
                                        onChange={e => setValorFixo(e.target.value)}
                                        placeholder="0.00"
                                        disabled={isReadOnly}
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Card 2 - Acessos/Contato */}
                <Card>
                    <CardHeader className="bg-orange-500/5 border-b border-orange-500/10">
                        <div className="flex items-center gap-2">
                            <Key className="w-5 h-5 text-orange-600" />
                            <CardTitle>Acessos / Contato</CardTitle>
                        </div>
                        <CardDescription>Informações para acesso remoto e contato com o cliente</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nome do Contato Chave</Label>
                                <Input value={nomeContatoChave} onChange={e => setNomeContatoChave(e.target.value)} disabled={isReadOnly} />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone</Label>
                                <Input value={telefone} onChange={e => setTelefone(e.target.value)} disabled={isReadOnly} />
                            </div>
                            <div className="space-y-2">
                                <Label>Acesso Anydesk</Label>
                                <Input value={acessoAnydesk} onChange={e => setAcessoAnydesk(e.target.value)} disabled={isReadOnly} />
                            </div>
                            <div className="space-y-2">
                                <Label>Senha Anydesk</Label>
                                <Input value={senhaAnydesk} onChange={e => setSenhaAnydesk(e.target.value)} disabled={isReadOnly} />
                            </div>
                            <div className="space-y-2">
                                <Label>Nome do Sistema</Label>
                                <Input value={nomeSistema} onChange={e => setNomeSistema(e.target.value)} disabled={isReadOnly} />
                            </div>
                            <div className="space-y-2">
                                <Label>Nome da Software House</Label>
                                <Input value={nomeSoftwareHouse} onChange={e => setNomeSoftwareHouse(e.target.value)} disabled={isReadOnly} />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label>Tipo do Banco de Dados (Usuário, senha e banco)</Label>
                                <Input value={tipoBancoDados} onChange={e => setTipoBancoDados(e.target.value)} disabled={isReadOnly} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Card 3 - Produto */}
                <Card>
                    <CardHeader className="bg-blue-500/5 border-b border-blue-500/10">
                        <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            <CardTitle>Produto</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <MigrationItemRow
                            label="Cadastro de Produto"
                            itemKey="cadastroProduto"
                            items={items}
                            setItems={setItems} isReadOnly={isReadOnly}
                            subQuestions={[
                                { key: 'trabalhaAtacado', label: 'Trabalha com atacado?' },
                                { key: 'trazerAtacadoAtual', label: 'Irá trazer o atacado atual?' },
                                { key: 'trabalhaPautaFiscal', label: 'Trabalha com a pauta fiscal?' },
                            ]}
                        />
                        <MigrationItemRow
                            label="Mercadológico"
                            itemKey="mercadologico"
                            items={items}
                            setItems={setItems} isReadOnly={isReadOnly}
                            subQuestions={[
                                { key: 'contratouFerramenta', label: 'Contratou a ferramenta de mercadológico?' },
                                { key: 'usarPadraoVR', label: 'Irá usar o mercadológico padrão VR?' },
                            ]}
                        />
                        <MigrationItemRow label="Família de Produtos" itemKey="familiaProdutos" items={items} setItems={setItems} isReadOnly={isReadOnly} />
                        <MigrationItemRow label="Produto Fornecedor" itemKey="produtoFornecedor" items={items} setItems={setItems} isReadOnly={isReadOnly} />
                        <MigrationItemRow
                            label="Balança (TXITENS, ITENSMGV)"
                            itemKey="balanca"
                            items={items}
                            setItems={setItems} isReadOnly={isReadOnly}
                            subQuestions={[
                                { key: 'temArquivoBalanca', label: 'Tem arquivo de balança?' },
                            ]}
                        />
                    </CardContent>
                </Card>



                {/* Card Novo - Fiscal e Tributário */}
                <Card>
                    <CardHeader className="bg-amber-500/5 border-b border-amber-500/10">
                        <div className="flex items-center gap-2">
                            <Scale className="w-5 h-5 text-amber-600" />
                            <CardTitle>Fiscal e Tributário</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {/* Item Customizado: Mapa de Tributação */}
                        <div className={`p-4 rounded-lg border ${items.mapaTributacao.migrar ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    checked={items.mapaTributacao.migrar}
                                    onCheckedChange={(checked) => {
                                        setItems({
                                            ...items,
                                            mapaTributacao: { ...items.mapaTributacao, migrar: !!checked }
                                        });
                                    }}
                                    className="mt-1"
                                />
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            className="font-medium cursor-pointer"
                                            onClick={() => !isReadOnly && setItems({
                                                ...items,
                                                mapaTributacao: { ...items.mapaTributacao, migrar: !items.mapaTributacao.migrar }
                                            })}
                                        >
                                            Mapa de Tributação
                                        </Label>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {items.mapaTributacao.tempoEstimado}
                                        </div>
                                    </div>

                                    {items.mapaTributacao.migrar ? (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                                            <Textarea
                                                placeholder="Observações..."
                                                value={items.mapaTributacao.observacoes}
                                                onChange={(e) => setItems({
                                                    ...items,
                                                    mapaTributacao: { ...items.mapaTributacao, observacoes: e.target.value }
                                                })}
                                                rows={2}
                                                className="text-sm"
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 pt-2">
                                            <div className="flex items-center gap-2 text-amber-600">
                                                <AlertCircle className="w-4 h-4" />
                                                <Label className="text-sm font-medium">Revisão Fiscal Obrigatória</Label>
                                            </div>
                                            <Input
                                                placeholder="Qual empresa será responsável pela revisão fiscal?"
                                                value={items.mapaTributacao.empresaResponsavel || ''}
                                                onChange={(e) => setItems({
                                                    ...items,
                                                    mapaTributacao: { ...items.mapaTributacao, empresaResponsavel: e.target.value }
                                                })}
                                                className="text-sm"
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Card 4 - Fornecedor, Cliente, Convênio */}
                <Card>
                    <CardHeader className="bg-purple-500/5 border-b border-purple-500/10">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-600" />
                            <CardTitle>Fornecedor, Cliente e Convênio</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <MigrationItemRow label="Cadastro de Fornecedor" itemKey="fornecedor" items={items} setItems={setItems} isReadOnly={isReadOnly} />
                        <MigrationItemRow label="Cadastro de Cliente Preferencial" itemKey="clientePreferencial" items={items} setItems={setItems} isReadOnly={isReadOnly} />
                        <MigrationItemRow label="Cadastro de Convênio (Empresa, Cliente, Transação)" itemKey="convenio" items={items} setItems={setItems} isReadOnly={isReadOnly} />
                    </CardContent>
                </Card>

                {/* Card 5 - Financeiro */}
                <Card>
                    <CardHeader className="bg-green-500/5 border-b border-green-500/10">
                        <div className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-green-600" />
                            <CardTitle>Financeiro</CardTitle>
                        </div>
                        <CardDescription>Por padrão a migração só traz registro em aberto. Controle por planilha não será migrado.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <MigrationItemRow
                            label="Cheque"
                            itemKey="cheque"
                            items={items}
                            setItems={setItems} isReadOnly={isReadOnly}
                            subQuestions={[{ key: 'controlaPeloSistema', label: 'Controla pelo sistema atual?' }]}
                        />
                        <MigrationItemRow
                            label="Crédito Rotativo (Fiado/Caderneta)"
                            itemKey="creditoRotativo"
                            items={items}
                            setItems={setItems} isReadOnly={isReadOnly}
                            subQuestions={[{ key: 'controlaPeloSistema', label: 'Controla pelo sistema atual?' }]}
                        />
                        <MigrationItemRow
                            label="Contas a Pagar (Fornecedor)"
                            itemKey="contasPagar"
                            items={items}
                            setItems={setItems} isReadOnly={isReadOnly}
                            subQuestions={[{ key: 'controlaPeloSistema', label: 'Controla pelo sistema atual?' }]}
                        />
                        <MigrationItemRow
                            label="Contas a Receber de Fornecedor (Devoluções, bonificações etc.)"
                            itemKey="contasReceberFornecedor"
                            items={items}
                            setItems={setItems} isReadOnly={isReadOnly}
                            subQuestions={[{ key: 'controlaPeloSistema', label: 'Controla pelo sistema atual?' }]}
                        />
                        <MigrationItemRow
                            label="Outras Despesas (Energia, Férias, Aluguel)"
                            itemKey="outrasDespesas"
                            items={items}
                            setItems={setItems} isReadOnly={isReadOnly}
                            subQuestions={[{ key: 'controlaPeloSistema', label: 'Controla pelo sistema atual?' }]}
                        />
                    </CardContent>
                </Card>

                {/* Card 6 - Histórico de Vendas */}
                <Card>
                    <CardHeader className="bg-cyan-500/5 border-b border-cyan-500/10">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-cyan-600" />
                            <CardTitle>Histórico de Vendas</CardTitle>
                        </div>
                        <CardDescription>Importado somente por base de dados. Não é possível realizar importação por planilhas.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <MigrationItemRow label="Histórico de Vendas (1 ano)" itemKey="historicoVendas" items={items} setItems={setItems} isReadOnly={isReadOnly} />
                    </CardContent>
                </Card>

                {/* Card 7 - Dados não importados */}
                <Card className="border-red-500/20">
                    <CardHeader className="bg-red-500/5 border-b border-red-500/10">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <CardTitle>Dados Não Importados</CardTitle>
                        </div>
                        <CardDescription>Os itens abaixo não serão importados em qualquer hipótese</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid sm:grid-cols-2 gap-2">
                            {NON_IMPORTED_ITEMS.map(item => (
                                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Card 8 - Datas de Virada */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-primary" />
                            <CardTitle className="text-sm">Datas de Virada</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dataPrevistaVirada" className="flex items-center gap-1.5">
                                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                                    Data Prevista de Virada
                                </Label>
                                <Input
                                    id="dataPrevistaVirada"
                                    type="date"
                                    value={dataPrevistaVirada}
                                    onChange={e => setDataPrevistaVirada(e.target.value)}
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dataViradaSistema" className="flex items-center gap-1.5">
                                    <CalendarCheck className="w-4 h-4 text-muted-foreground" />
                                    Data de Virada de Sistema
                                </Label>
                                <Input
                                    id="dataViradaSistema"
                                    type="date"
                                    value={dataViradaSistema}
                                    onChange={e => setDataViradaSistema(e.target.value)}
                                    disabled={isReadOnly}
                                />
                                <p className="text-xs text-muted-foreground">Data efetiva da migração final</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Card 9 - Observações Gerais */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Observações Gerais</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={observacoes}
                            onChange={e => setObservacoes(e.target.value)}
                            rows={4}
                            placeholder="Observações adicionais sobre a migração..."
                            disabled={isReadOnly}
                        />
                    </CardContent>
                </Card>

                {/* Card 9 - Controle Financeiro (Lançamentos) */}
                {isEditing && (
                    <Card>
                        <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10">
                            <div className="flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-emerald-600" />
                                <CardTitle>Controle Financeiro</CardTitle>
                            </div>
                            <CardDescription>Lançamento de horas ou valores extras</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Formulário de Lançamento */}
                            {!isReadOnly && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-lg bg-muted/20">
                                    <div className="space-y-2">
                                        <Label>Data</Label>
                                        <Input
                                            type="date"
                                            value={novoLancamento.data}
                                            onChange={e => setNovoLancamento({ ...novoLancamento, data: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{tipoCobranca === 'hora' ? 'Horas' : 'Valor (R$)'}</Label>
                                        <Input
                                            type="number"
                                            placeholder={tipoCobranca === 'hora' ? '0.0' : '0.00'}
                                            value={tipoCobranca === 'hora' ? novoLancamento.hours : novoLancamento.valor}
                                            onChange={e => setNovoLancamento({
                                                ...novoLancamento,
                                                [tipoCobranca === 'hora' ? 'hours' : 'valor']: e.target.value
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Descrição</Label>
                                        <Input
                                            placeholder="Opcional"
                                            value={novoLancamento.descricao}
                                            onChange={e => setNovoLancamento({ ...novoLancamento, descricao: e.target.value })}
                                        />
                                    </div>
                                    <Button onClick={handleAddLancamento} variant="secondary">Adicionar</Button>
                                </div>
                            )}

                            {/* Tabela de Lançamentos */}
                            <div className="border rounded-md">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b">
                                        <tr>
                                            <th className="p-3 text-left font-medium">Data</th>
                                            <th className="p-3 text-left font-medium">Usuário</th>
                                            <th className="p-3 text-left font-medium">Descrição</th>
                                            <th className="p-3 text-right font-medium">{tipoCobranca === 'hora' ? 'Horas' : 'Valor'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lancamentos.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                                    Nenhum lançamento registrado.
                                                </td>
                                            </tr>
                                        )}
                                        {lancamentos.map((lanc) => (
                                            <tr key={lanc.id} className="border-b last:border-0 hover:bg-muted/5">
                                                <td className="p-3">{formatDateTime(lanc.data)}</td>
                                                <td className="p-3">{lanc.user?.profile?.fullName || lanc.user?.email}</td>
                                                <td className="p-3">{lanc.descricao || '-'}</td>
                                                <td className="p-3 text-right font-medium">
                                                    {lanc.horas ? `${lanc.horas}h` : `R$ ${lanc.valor}`}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {lancamentos.length > 0 && (
                                        <tfoot className="bg-muted/50 font-medium border-t">
                                            <tr>
                                                <td className="p-3" colSpan={3}>Total</td>
                                                <td className="p-3 text-right">
                                                    {tipoCobranca === 'hora'
                                                        ? `${lancamentos.reduce((acc, l) => acc + (Number(l.horas) || 0), 0).toFixed(2)}h`
                                                        : `R$ ${lancamentos.reduce((acc, l) => acc + (Number(l.valor) || 0), 0).toFixed(2)}`
                                                    }
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Card 9 - Histórico (somente edição) */}
                {isEditing && (
                    <Card>
                        <CardHeader className="bg-gray-500/5 border-b border-gray-500/10">
                            <div className="flex items-center gap-2">
                                <History className="w-5 h-5 text-gray-600" />
                                <CardTitle>Histórico da Migração</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Adicionar entrada */}
                            {!isReadOnly && (
                                <div className="p-4 rounded-lg border border-dashed space-y-3">
                                    <Label className="text-sm font-medium">Adicionar ao Histórico</Label>
                                    <div className="space-y-3">
                                        <Input
                                            placeholder="Ação (ex: Reunião realizada)"
                                            value={historyAction}
                                            onChange={e => setHistoryAction(e.target.value)}
                                        />
                                        <Textarea
                                            placeholder="Detalhes (opcional) - Use Enter para quebras de linha"
                                            value={historyDetails}
                                            onChange={e => setHistoryDetails(e.target.value)}
                                            rows={4}
                                            className="resize-y"
                                        />
                                        <Button
                                            onClick={() => addHistoryMutation.mutate()}
                                            disabled={!historyAction || addHistoryMutation.isPending}
                                            size="sm"
                                            className="gap-2 w-full sm:w-auto"
                                        >
                                            <Send className="w-4 h-4" />
                                            Adicionar
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="space-y-1">
                                {historyLoading && (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                                {!historyLoading && historyData.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro no histórico.</p>
                                )}
                                {!historyLoading && historyData.map((entry, idx) => (
                                    <div key={entry.id} className="flex gap-3 py-3 border-b border-border last:border-0">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${entry.action.includes('criada') ? 'bg-green-500' :
                                                entry.action.includes('Status') ? 'bg-blue-500' :
                                                    entry.action.includes('atualizado') ? 'bg-yellow-500' :
                                                        'bg-gray-400'
                                                }`} />
                                            {idx < historyData.length - 1 && (
                                                <div className="w-px flex-1 bg-border mt-1" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-medium">{entry.action}</span>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatDateTime(entry.createdAt)}
                                                </span>
                                            </div>
                                            {entry.user && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    por {entry.user.profile?.fullName || entry.user.email}
                                                </p>
                                            )}
                                            {entry.details && (
                                                <div className="mt-1 text-xs bg-muted/50 p-2 rounded-md space-y-1">
                                                    {(() => {
                                                        try {
                                                            const parsed = JSON.parse(entry.details);
                                                            // Se é um objeto com chaves de/para, renderiza diff
                                                            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                                                                const hasDiff = Object.values(parsed).some((v: any) => v && typeof v === 'object' && 'de' in v && 'para' in v);
                                                                if (hasDiff) {
                                                                    return Object.entries(parsed).map(([campo, val]: [string, any]) => (
                                                                        <div key={campo} className="flex flex-wrap gap-1">
                                                                            <span className="font-semibold text-foreground">{campo}:</span>
                                                                            <span className="text-red-500 line-through">{typeof val.de === 'object' ? JSON.stringify(val.de) : String(val.de ?? '(vazio)')}</span>
                                                                            <span className="text-muted-foreground">→</span>
                                                                            <span className="text-green-600">{typeof val.para === 'object' ? JSON.stringify(val.para) : String(val.para ?? '(vazio)')}</span>
                                                                        </div>
                                                                    ));
                                                                }
                                                            }
                                                            return <span className="text-muted-foreground">{entry.details}</span>;
                                                        } catch (e) {
                                                            return <span className="text-muted-foreground">{entry.details}</span>;
                                                        }
                                                    })()}
                                                </div>
                                            )}
                                            {entry.newStatus && (
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant="outline" className={MigrationStatusColors[entry.oldStatus as MigrationStatus] || ''}>
                                                        {MigrationStatusLabels[entry.oldStatus as MigrationStatus] || entry.oldStatus}
                                                    </Badge>
                                                    <span className="text-muted-foreground">→</span>
                                                    <Badge variant="outline" className={MigrationStatusColors[entry.newStatus as MigrationStatus] || ''}>
                                                        {MigrationStatusLabels[entry.newStatus as MigrationStatus] || entry.newStatus}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </Wrapper>
    );
}

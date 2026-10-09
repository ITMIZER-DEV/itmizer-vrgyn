import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { backupService, BackupConfig, BackupLog } from '@/services/backupService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    HardDrive,
    Cloud,
    Clock,
    Calendar,
    Download,
    RotateCcw,
    Play,
    CheckCircle2,
    AlertTriangle,
    ExternalLink,
    RefreshCw,
    ShieldCheck,
    Key,
    FileJson,
    Upload,
} from 'lucide-react';

export function BackupsContent() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [testingDrive, setTestingDrive] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);
    const [restoringId, setRestoringId] = useState<string | null>(null);

    const [config, setConfig] = useState<BackupConfig>({
        id: 'default',
        scheduleEnabled: true,
        scheduleTime: '00:00',
        frequency: 'DAILY',
        googleDriveEnabled: true,
        googleDriveFolderId: '0AAzNdB7t26iUUk9PVA',
        googleDriveFolderUrl: 'https://drive.google.com/drive/folders/0AAzNdB7t26iUUk9PVA',
        retentionDays: 15,
        backupFormat: 'HYBRID',
        updatedAt: '',
    });

    const [logs, setLogs] = useState<BackupLog[]>([]);
    const [selectedLogForRestore, setSelectedLogForRestore] = useState<BackupLog | null>(null);
    const [driveTestResult, setDriveTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [cfg, logsData] = await Promise.all([
                backupService.getConfig(),
                backupService.getLogs(),
            ]);
            setConfig(cfg);
            setLogs(logsData);
        } catch (error: any) {
            toast({
                title: 'Erro ao carregar dados de backup',
                description: error.response?.data?.message || error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSaveConfig = async () => {
        setSavingConfig(true);
        try {
            const updated = await backupService.updateConfig(config);
            setConfig(updated);
            toast({
                title: 'Configurações Salvas',
                description: 'As configurações de agenda e Google Drive foram atualizadas com sucesso.',
            });
        } catch (error: any) {
            toast({
                title: 'Erro ao salvar configurações',
                description: error.response?.data?.message || error.message,
                variant: 'destructive',
            });
        } finally {
            setSavingConfig(false);
        }
    };

    const handleTestDrive = async () => {
        setTestingDrive(true);
        setDriveTestResult(null);
        try {
            const res = await backupService.testGoogleDrive(config.googleDriveFolderId, config.googleServiceAccountJson);
            setDriveTestResult(res);
            if (res.success) {
                toast({
                    title: 'Google Drive Conectado!',
                    description: res.message,
                });
            } else {
                toast({
                    title: 'Aviso do Google Drive',
                    description: res.message,
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            setDriveTestResult({
                success: false,
                message: error.response?.data?.message || error.message,
            });
            toast({
                title: 'Falha no Teste',
                description: error.response?.data?.message || error.message,
                variant: 'destructive',
            });
        } finally {
            setTestingDrive(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const parsed = JSON.parse(content);
                if (parsed.client_email && (parsed.private_key || parsed.type === 'service_account')) {
                    setConfig({
                        ...config,
                        googleServiceAccountJson: content,
                        googleServiceAccountEmail: parsed.client_email,
                    });
                    toast({
                        title: 'Chave Carregada com Sucesso!',
                        description: `Conta de Serviço: ${parsed.client_email}`,
                    });
                } else {
                    toast({
                        title: 'Arquivo Inválido',
                        description: 'O arquivo JSON selecionado não possui as chaves client_email / private_key do Google Cloud.',
                        variant: 'destructive',
                    });
                }
            } catch (err: any) {
                toast({
                    title: 'Erro ao ler arquivo JSON',
                    description: err.message,
                    variant: 'destructive',
                });
            }
        };
        reader.readAsText(file);
    };

    const handleGenerateBackup = async () => {
        setGenerating(true);
        try {
            toast({
                title: 'Gerando Backup...',
                description: 'Extraindo dados e sincronizando com o Google Drive.',
            });
            const newLog = await backupService.generateBackup();
            setLogs([newLog, ...logs]);
            toast({
                title: 'Backup Concluído!',
                description: `${newLog.totalRecords} registros salvos no arquivo ${newLog.filename}`,
            });
            loadData();
        } catch (error: any) {
            toast({
                title: 'Erro ao gerar backup',
                description: error.response?.data?.message || error.message,
                variant: 'destructive',
            });
        } finally {
            setGenerating(false);
        }
    };

    const handleConfirmRestore = async () => {
        if (!selectedLogForRestore) return;
        setRestoringId(selectedLogForRestore.id);
        try {
            const res = await backupService.restoreBackup(selectedLogForRestore.id);
            toast({
                title: 'Restauração Concluída!',
                description: `${res.totalRestored} registros restaurados a partir de ${res.filename}`,
            });
            setSelectedLogForRestore(null);
        } catch (error: any) {
            toast({
                title: 'Erro na Restauração',
                description: error.response?.data?.message || error.message,
                variant: 'destructive',
            });
        } finally {
            setRestoringId(null);
        }
    };

    const handleDownload = async (log: BackupLog) => {
        try {
            toast({
                title: 'Iniciando Download...',
                description: `Baixando ${log.filename}`,
            });
            await backupService.downloadBackup(log.id, log.filename);
        } catch (error: any) {
            toast({
                title: 'Erro no Download',
                description: error.response?.data?.message || error.message,
                variant: 'destructive',
            });
        }
    };

    const lastLog = logs.length > 0 ? logs[0] : null;

    return (
        <div className="space-y-6">
            {/* Header da Ação */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-lg border shadow-sm">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <HardDrive className="w-6 h-6 text-primary" />
                        Backups & Sincronização em Nuvem
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        Rotina diária autônoma, retenção de 15 dias e integração direta com pasta Google Drive.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-1.5">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Button onClick={handleGenerateBackup} disabled={generating} className="gap-1.5 bg-primary font-semibold">
                        <Play className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                        {generating ? 'Gerando...' : 'Gerar Backup Agora'}
                    </Button>
                </div>
            </div>

            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Agenda Automática</CardTitle>
                        <Clock className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Badge variant={config.scheduleEnabled ? 'default' : 'secondary'}>
                                {config.scheduleEnabled ? 'Ativo' : 'Desativado'}
                            </Badge>
                            <span className="text-xs font-semibold">
                                {config.scheduleEnabled ? `Diário às ${config.scheduleTime}` : 'Manual'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Google Drive</CardTitle>
                        <Cloud className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                                {config.googleDriveEnabled ? 'Habilitado' : 'Desativado'}
                            </Badge>
                            <a
                                href={`https://drive.google.com/drive/folders/${config.googleDriveFolderId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                Abrir Pasta <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Retenção</CardTitle>
                        <Calendar className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-foreground">
                            {config.retentionDays} Dias
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Último Snapshot</CardTitle>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs font-bold text-foreground">
                            {lastLog ? new Date(lastLog.createdAt).toLocaleString('pt-BR') : 'Nenhum'}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            {lastLog ? `${lastLog.totalRecords} registros (${lastLog.fileSizeFormatted || 'OK'})` : 'Pendente'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Painel de Configurações */}
            <Card className="border-border/60">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Configurações da Agenda & Destino Google Drive
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Personalize o horário diário e a pasta de armazenamento dos backups em nuvem.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 rounded-lg border bg-card space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">Rotina Diária</Label>
                                <Switch
                                    checked={config.scheduleEnabled}
                                    onCheckedChange={(v) => setConfig({ ...config, scheduleEnabled: v })}
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Disparo automático diário no horário selecionado.
                            </p>
                        </div>

                        <div className="p-3 rounded-lg border bg-card space-y-1.5">
                            <Label className="text-xs font-semibold">Horário de Disparo</Label>
                            <Select
                                value={config.scheduleTime}
                                onValueChange={(v) => setConfig({ ...config, scheduleTime: v })}
                                disabled={!config.scheduleEnabled}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Selecione o horário" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="00:00">00:00 (Meia-noite)</SelectItem>
                                    <SelectItem value="01:00">01:00 da madrugada</SelectItem>
                                    <SelectItem value="02:00">02:00 da madrugada</SelectItem>
                                    <SelectItem value="03:00">03:00 da madrugada</SelectItem>
                                    <SelectItem value="04:00">04:00 da madrugada</SelectItem>
                                    <SelectItem value="12:00">12:00 (Meio-dia)</SelectItem>
                                    <SelectItem value="22:00">22:00 da noite</SelectItem>
                                    <SelectItem value="23:00">23:00 da noite</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="p-3 rounded-lg border bg-card space-y-1.5">
                            <Label className="text-xs font-semibold">Dias de Retenção</Label>
                            <Select
                                value={String(config.retentionDays)}
                                onValueChange={(v) => setConfig({ ...config, retentionDays: Number(v) })}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Selecione os dias" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">7 dias (1 semana)</SelectItem>
                                    <SelectItem value="15">15 dias (Padrão)</SelectItem>
                                    <SelectItem value="30">30 dias (1 mês)</SelectItem>
                                    <SelectItem value="60">60 dias (2 meses)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                                <Cloud className="w-3.5 h-3.5 text-primary" />
                                Pasta no Google Drive (ID ou Link Completo)
                            </Label>
                            <div className="flex items-center gap-1.5">
                                <Switch
                                    checked={config.googleDriveEnabled}
                                    onCheckedChange={(v) => setConfig({ ...config, googleDriveEnabled: v })}
                                />
                                <span className="text-xs font-medium">Sincronizar no Drive</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                                value={config.googleDriveFolderId}
                                onChange={(e) => setConfig({ ...config, googleDriveFolderId: e.target.value })}
                                placeholder="ID ou URL da pasta Google Drive (ex: 0AAzNdB7t26iUUk9PVA)"
                                className="font-mono text-xs h-8"
                                disabled={!config.googleDriveEnabled}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleTestDrive}
                                disabled={testingDrive || !config.googleDriveEnabled}
                                className="h-8 gap-1.5 whitespace-nowrap text-xs"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${testingDrive ? 'animate-spin' : ''}`} />
                                Testar Conexão
                            </Button>
                        </div>

                        {/* Configuração da Chave de Serviço no Banco de Dados */}
                        <div className="pt-2 border-t border-border/40 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <Label className="text-xs font-semibold flex items-center gap-1.5">
                                    <Key className="w-3.5 h-3.5 text-amber-500" />
                                    Chave da Conta de Serviço Google (JSON)
                                    {config.googleServiceAccountEmail && (
                                        <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                            {config.googleServiceAccountEmail}
                                        </Badge>
                                    )}
                                </Label>
                                <div>
                                    <input
                                        type="file"
                                        id="sa-json-upload"
                                        accept=".json"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-[11px] gap-1.5"
                                        onClick={() => document.getElementById('sa-json-upload')?.click()}
                                    >
                                        <Upload className="w-3 h-3" />
                                        Carregar Arquivo .JSON
                                    </Button>
                                </div>
                            </div>
                            <Textarea
                                value={config.googleServiceAccountJson || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    let email = config.googleServiceAccountEmail;
                                    try {
                                        if (val.trim().startsWith('{')) {
                                            const p = JSON.parse(val);
                                            if (p.client_email) email = p.client_email;
                                        }
                                    } catch {}
                                    setConfig({ ...config, googleServiceAccountJson: val, googleServiceAccountEmail: email });
                                }}
                                placeholder='Cole o conteúdo do arquivo JSON da chave do Google Cloud (contendo "client_email" e "private_key") para salvar direto no banco de dados...'
                                className="font-mono text-[11px] min-h-[70px] bg-background/80"
                                disabled={!config.googleDriveEnabled}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                💡 Ao salvar aqui, as credenciais ficam gravadas com segurança no banco de dados, sem necessidade de editar o arquivo <code>.env</code> ou reiniciar contêineres.
                            </p>
                        </div>

                        {driveTestResult && (
                            <div
                                className={`p-2.5 rounded-md text-xs flex items-center gap-2 ${
                                    driveTestResult.success
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                        : 'bg-destructive/10 text-destructive border border-destructive/20'
                                }`}
                            >
                                {driveTestResult.success ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                ) : (
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                )}
                                <span>{driveTestResult.message}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <Button size="sm" onClick={handleSaveConfig} disabled={savingConfig} className="gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {savingConfig ? 'Salvando...' : 'Salvar Configurações'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tabela de Histórico */}
            <Card className="border-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                        <CardTitle className="text-base">Histórico de Backups</CardTitle>
                        <CardDescription className="text-xs">
                            Snapshots gerados e status de sincronização com o Google Drive.
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                        {logs.length} backups
                    </Badge>
                </CardHeader>
                <CardContent>
                    {logs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-xs">
                            Nenhum backup registrado até o momento.
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs">Arquivo</TableHead>
                                        <TableHead className="text-xs">Data / Hora</TableHead>
                                        <TableHead className="text-xs">Tipo</TableHead>
                                        <TableHead className="text-xs">Registros</TableHead>
                                        <TableHead className="text-xs">Tamanho</TableHead>
                                        <TableHead className="text-xs">Google Drive</TableHead>
                                        <TableHead className="text-right text-xs">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-mono text-xs font-medium">
                                                {log.filename}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString('pt-BR')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={log.type === 'AUTOMATIC' ? 'secondary' : 'default'} className="text-[10px]">
                                                    {log.type === 'AUTOMATIC' ? 'Automático' : 'Manual'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold">
                                                {log.totalRecords.toLocaleString('pt-BR')} regs ({log.tablesCount} tabs)
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {log.fileSizeFormatted || `${(log.fileSize / 1024).toFixed(1)} KB`}
                                            </TableCell>
                                            <TableCell>
                                                {log.googleDriveStatus === 'UPLOADED' ? (
                                                    <div className="flex items-center gap-1">
                                                        <Badge className="bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                                                            Sincronizado
                                                        </Badge>
                                                        {log.googleDriveWebUrl && (
                                                            <a
                                                                href={log.googleDriveWebUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-primary hover:text-primary/80"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : log.googleDriveStatus === 'FAILED' ? (
                                                    <Badge variant="destructive" className="text-[10px]" title={log.googleDriveError || 'Falha no upload'}>
                                                        Falha Drive
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {log.googleDriveStatus}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDownload(log)}
                                                        className="h-7 px-2 gap-1 text-xs"
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        Download
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => setSelectedLogForRestore(log)}
                                                        className="h-7 px-2 gap-1 text-xs"
                                                    >
                                                        <RotateCcw className="w-3 h-3" />
                                                        Restaurar
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Restauração */}
            <Dialog open={!!selectedLogForRestore} onOpenChange={(open) => !open && setSelectedLogForRestore(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            Confirmar Restauração de Banco de Dados
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-sm text-foreground">
                            Você está prestes a restaurar os dados do sistema a partir de:
                            <br />
                            <span className="font-mono text-xs font-semibold text-primary block mt-1">
                                {selectedLogForRestore?.filename}
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-3 rounded-md text-xs space-y-1">
                        <p className="font-semibold">⚠️ Atenção:</p>
                        <p>
                            Esta ação irá atualizar e reinserir todos os registros da base com o snapshot ({selectedLogForRestore?.totalRecords} registros).
                        </p>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setSelectedLogForRestore(null)} disabled={!!restoringId}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmRestore} disabled={!!restoringId} className="gap-1.5">
                            <RotateCcw className={`w-3.5 h-3.5 ${restoringId ? 'animate-spin' : ''}`} />
                            {restoringId ? 'Restaurando...' : 'Confirmar Restauração'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { assessmentService } from '@/services/assessmentService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, RefreshCw, Server, Globe, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ValidationReportProps {
    assessmentId: string;
}

export function ValidationReport({ assessmentId }: ValidationReportProps) {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const data = await assessmentService.validate(assessmentId);
            setReport(data);
        } catch (error) {
            console.error('Erro ao gerar relatório', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRelease = async (itemId: string, field: string) => {
        try {
            await assessmentService.toggleRelease(assessmentId, itemId, field);
            // Refresh report after toggle
            const data = await assessmentService.validate(assessmentId);
            setReport(data);
        } catch (error) {
            console.error('Erro ao liberar item', error);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [assessmentId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Gerando relatório de adequação...</p>
            </div>
        );
    }

    if (!report) return null;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ok': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'error': return <XCircle className="w-5 h-5 text-destructive" />;
            default: return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ok': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Adequado</Badge>;
            case 'warning': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none">Atenção</Badge>;
            case 'error': return <Badge variant="destructive">Inadequado</Badge>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-2xl font-bold font-display">Relatório de Adequações Técnicas</h2>
                    <p className="text-muted-foreground">Comparativo entre a infraestrutura atual e os requisitos homologados</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className="text-sm font-medium">Status Geral:</span>
                        {getStatusBadge(report.summary.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">{report.summary.totalIssues} inconformidades encontradas</p>
                </div>
            </div>

            {report.servers.length > 0 && (
                <Card className="glass-card overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <div className="flex items-center gap-2">
                            <Server className="w-5 h-5 text-primary" />
                            <CardTitle>Hardware de Servidores</CardTitle>
                        </div>
                        <CardDescription>Análise comparativa de CPU, RAM e Armazenamento</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[200px]">Servidor / Item</TableHead>
                                    <TableHead>Configuração Atual</TableHead>
                                    <TableHead></TableHead>
                                    <TableHead>Mínimo Requerido</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {report.servers.map((s: any) => (
                                    <React.Fragment key={s.id || s.tipo}>
                                        {s.status === 'missing' ? (
                                            <TableRow key={s.tipo} className="bg-destructive/5">
                                                <TableCell className="font-bold text-destructive">{s.label} - NÃO ENCONTRADO</TableCell>
                                                <TableCell className="text-destructive">Item obrigatório ausente</TableCell>
                                                <TableCell></TableCell>
                                                <TableCell>{s.required?.cpu || '-'} Cores / {s.required?.ram || '-'} GB</TableCell>
                                                <TableCell className="text-right"><XCircle className="w-5 h-5 text-destructive" /></TableCell>
                                            </TableRow>
                                        ) : (
                                            <React.Fragment>
                                                <TableRow key={`${s.id}-cpu`} className="group">
                                                    <TableCell className="font-medium">{s.label} - Processador</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span>{s.current.cpu} Cores</span>
                                                            <span className="text-[10px] text-muted-foreground">{s.current.processor || 'N/A'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell><ArrowRight className="w-4 h-4 text-muted-foreground opacity-30" /></TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span>{s.required?.cpu || '-'} Cores</span>
                                                            <span className="text-[10px] text-muted-foreground">{s.required?.processor || 'N/A'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {s.approvals?.cpu && (
                                                                <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded border border-green-200">
                                                                    Liberado por {s.approvals.cpu.user} em {new Date(s.approvals.cpu.date).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                            {getStatusIcon(s.comparison.cpu)}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                                onClick={() => handleToggleRelease(s.id, 'cpu')}
                                                                title={s.approvals?.cpu ? "Remover Liberação" : "Liberar Item"}
                                                            >
                                                                <CheckCircle2 className={`w-4 h-4 ${s.approvals?.cpu ? 'text-primary' : 'opacity-20'}`} />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow key={`${s.id}-os`}>
                                                    <TableCell className="font-medium pl-8 text-xs text-muted-foreground">Sistema Operacional</TableCell>
                                                    <TableCell className="text-xs">{s.current.os || 'N/A'}</TableCell>
                                                    <TableCell><ArrowRight className="w-4 h-4 text-muted-foreground opacity-30" /></TableCell>
                                                    <TableCell className="text-xs">{s.required?.os || 'N/A'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 opacity-50 ml-auto" />
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow key={`${s.id}-ram`}>
                                                    <TableCell className="font-medium pl-8 text-xs text-muted-foreground">Memória RAM</TableCell>
                                                    <TableCell>{s.current.ram} GB</TableCell>
                                                    <TableCell><ArrowRight className="w-4 h-4 text-muted-foreground opacity-30" /></TableCell>
                                                    <TableCell>{s.required?.ram || '-'} GB</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {s.approvals?.ram && (
                                                                <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded border border-green-200">
                                                                    Liberado por {s.approvals.ram.user}
                                                                </span>
                                                            )}
                                                            {getStatusIcon(s.comparison.ram)}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => handleToggleRelease(s.id, 'ram')}
                                                            >
                                                                <CheckCircle2 className={`w-3 h-3 ${s.approvals?.ram ? 'text-primary' : 'opacity-20'}`} />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow key={`${s.id}-storage`} className="border-b-2">
                                                    <TableCell className="font-medium pl-8 text-xs text-muted-foreground">Disco (HD / SSD)</TableCell>
                                                    <TableCell>{s.current.storage} GB</TableCell>
                                                    <TableCell><ArrowRight className="w-4 h-4 text-muted-foreground opacity-30" /></TableCell>
                                                    <TableCell>{s.required?.storage || '-'} GB</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {s.approvals?.storage && (
                                                                <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded border border-green-200">
                                                                    Liberado por {s.approvals.storage.user}
                                                                </span>
                                                            )}
                                                            {getStatusIcon(s.comparison.storage)}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => handleToggleRelease(s.id, 'storage')}
                                                            >
                                                                <CheckCircle2 className={`w-3 h-3 ${s.approvals?.storage ? 'text-primary' : 'opacity-20'}`} />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {report.terminals.length > 0 && (
                <Card className="glass-card overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <div className="flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-primary" />
                            <CardTitle>Hardware de PDVs (Terminais)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[200px]">Item</TableHead>
                                    <TableHead>Configuração Atual</TableHead>
                                    <TableHead></TableHead>
                                    <TableHead>Mínimo Requerido</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {report.terminals.map((t: any) => (
                                    <React.Fragment key={t.id}>
                                        <TableRow className="group">
                                            <TableCell className="font-medium">
                                                {t.tipo === 'Retaguarda'
                                                    ? `Retaguarda: ${t.funcao || 'Computador'}`
                                                    : `PDV (ID: ${t.id.substring(0, 8)})`}
                                                {t.quantidade && t.quantidade > 1 && (
                                                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                        {t.quantidade}x
                                                    </span>
                                                )}
                                                {' '}- Memória RAM
                                            </TableCell>
                                            <TableCell>{t.current.ram} GB</TableCell>
                                            <TableCell><ArrowRight className="w-4 h-4 text-muted-foreground opacity-30" /></TableCell>
                                            <TableCell>{t.required?.ram || '-'} GB</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {t.approvals?.ram && (
                                                        <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded border border-green-200">
                                                            Liberado por {t.approvals.ram.user}
                                                        </span>
                                                    )}
                                                    {getStatusIcon(t.status.ram)}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => handleToggleRelease(t.id, 'ram')}
                                                    >
                                                        <CheckCircle2 className={`w-3 h-3 ${t.approvals?.ram ? 'text-primary' : 'opacity-20'}`} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow key={`${t.id}-cpu`}>
                                            <TableCell className="font-medium pl-8 text-xs text-muted-foreground">Processador</TableCell>
                                            <TableCell className="text-xs">{t.current.cpu || 'N/A'}</TableCell>
                                            <TableCell><ArrowRight className="w-4 h-4 text-muted-foreground opacity-30" /></TableCell>
                                            <TableCell className="text-xs">{t.required?.cpu || 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {t.approvals?.cpu && (
                                                        <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded border border-green-200">
                                                            Liberado por {t.approvals.cpu.user}
                                                        </span>
                                                    )}
                                                    {getStatusIcon(t.status.cpu)}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => handleToggleRelease(t.id, 'cpu')}
                                                    >
                                                        <CheckCircle2 className={`w-3 h-3 ${t.approvals?.cpu ? 'text-primary' : 'opacity-20'}`} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow key={`${t.id}-os`}>
                                            <TableCell className="font-medium pl-8 text-xs text-muted-foreground">Sistema Operacional</TableCell>
                                            <TableCell className="text-xs">{t.current.os || 'N/A'}</TableCell>
                                            <TableCell><ArrowRight className="w-4 h-4 text-muted-foreground opacity-30" /></TableCell>
                                            <TableCell className="text-xs">{t.required?.os || 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {t.approvals?.os && (
                                                        <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded border border-green-200">
                                                            Liberado por {t.approvals.os.user}
                                                        </span>
                                                    )}
                                                    {getStatusIcon(t.status.os)}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => handleToggleRelease(t.id, 'os')}
                                                    >
                                                        <CheckCircle2 className={`w-3 h-3 ${t.approvals?.os ? 'text-primary' : 'opacity-20'}`} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow key={`${t.id}-storage`} className="border-b-2">
                                            <TableCell className="font-medium pl-8 text-xs text-muted-foreground">Disco (HD / SSD)</TableCell>
                                            <TableCell className="text-xs">{t.current.storage} GB</TableCell>
                                            <TableCell><ArrowRight className="w-4 h-4 text-muted-foreground opacity-30" /></TableCell>
                                            <TableCell className="text-xs">{t.required?.storage || '-'} GB</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {t.approvals?.storage && (
                                                        <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded border border-green-200">
                                                            Liberado por {t.approvals.storage.user}
                                                        </span>
                                                    )}
                                                    {getStatusIcon(t.status.storage)}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => handleToggleRelease(t.id, 'storage')}
                                                    >
                                                        <CheckCircle2 className={`w-3 h-3 ${t.approvals?.storage ? 'text-primary' : 'opacity-20'}`} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {report.internet.length > 0 && (
                <Card className="glass-card">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" />
                            <CardTitle>Conectividade (Internet)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {report.internet.map((link: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Link de Dados Principal</p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>Atual: <b className="text-foreground">{link.current} Mbps</b></span>
                                        <span>Requerido: <b className="text-foreground">{link.required} Mbps</b></span>
                                    </div>
                                </div>
                                {getStatusBadge(link.status)}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {report.summary.status !== 'ok' && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-bold text-orange-800 flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        Recomendações de Adequação
                    </h4>
                    <ul className="text-sm text-orange-700 space-y-1 list-disc list-inside">
                        {report.summary.status === 'error' && (
                            <li>Upgrade crítico necessário: Um ou mais componentes estão abaixo do limite operacional homologado.</li>
                        )}
                        {report.servers.some((s: any) => s.status === 'missing') && (
                            <li className="font-bold">Servidores Obrigatórios Ausentes: Banco de Dados, Aplicação ou Service Manager devem ser instalados.</li>
                        )}
                        {report.servers.some((s: any) => s.comparison?.ram === 'error') && (
                            <li>Aumentar Memória RAM dos servidores para atingir o mínimo de performance garantida.</li>
                        )}
                        {report.internet.some((i: any) => i.status === 'warning') && (
                            <li>Revisar link de internet: O download atual pode causar lentidão em operações de nuvem.</li>
                        )}
                        {report.terminals.some((t: any) => t.status.ram === 'error' && t.tipo === 'PDV') && (
                            <li>Upgrade de memória nos PDVs: Um ou mais terminais possuem RAM insuficiente para o VRFront.</li>
                        )}
                        {report.terminals.some((t: any) => t.status.ram === 'error' && t.tipo === 'Retaguarda') && (
                            <li>Upgrade de memória na Retaguarda: Um ou mais computadores possuem RAM insuficiente.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

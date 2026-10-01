import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { clientService, CreateClientDto } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, FileText, Database, Clock, History as HistoryIcon, MapIcon, LifeBuoy, Link as LinkIcon } from 'lucide-react';
import { assessmentService } from '@/services/assessmentService';
import { migrationService, MigrationStatusLabels } from '@/services/migrationService';
import { deploymentService, DeploymentStatusLabels } from '@/services/deploymentService';
import { recemVrService } from '@/services/recemVrService';
import { STATUS_LABELS as RECEM_VR_STATUS_LABELS } from '@/types/recemVr';
import { AssessmentData } from '@/types/assessment';
import { AssessmentForm } from '@/components/assessment/AssessmentForm';
import MigrationForm from '@/pages/Migration/Form';
import DeploymentForm from '@/pages/Deployments/Form';
import { cn } from '@/lib/utils';
import ClientInfrastructureTab from './ClientInfrastructureTab';
import ClientCredentialsTab from './ClientCredentialsTab';
import ClientTicketsTab from './ClientTicketsTab';
import ClientCriticalCasesTab from './ClientCriticalCasesTab';
import { usePermissions } from '@/hooks/usePermissions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const SECTIONS = [
    { value: 'dados-cadastrais', label: 'Dados cadastrais' },
    { value: 'validacoes', label: 'Validações' },
    { value: 'migracoes', label: 'Migrações' },
    { value: 'implantacoes', label: 'Implantações' },
    { value: 'recem-vr', label: 'Recém VR' },
    { value: 'tickets', label: 'Tickets' },
    { value: 'casos-criticos', label: 'Casos Críticos' },
    { value: 'infraestrutura', label: 'Infraestrutura' },
    { value: 'vault', label: 'Vault de Acessos' },
    { value: 'historico', label: 'Histórico' },
] as const;

export default function ClientForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isEditing = !!id;
    const [activeSection, setActiveSection] = useState<string>('dados-cadastrais');
    const { canSpecial } = usePermissions('/clients');
    const { canView: canViewValidacoes } = usePermissions('/assessments');
    const { canView: canViewMigracoes } = usePermissions('/migration');
    const { canView: canViewImplantacoes } = usePermissions('/deployments');
    const visibleSections = SECTIONS.filter((section) => {
        if (section.value === 'validacoes') return canViewValidacoes;
        if (section.value === 'migracoes') return canViewMigracoes;
        if (section.value === 'implantacoes') return canViewImplantacoes;
        return true;
    });
    const [driveLinkDialogOpen, setDriveLinkDialogOpen] = useState(false);
    const [driveLinkInput, setDriveLinkInput] = useState('');
    const [activeAssessment, setActiveAssessment] = useState<AssessmentData | null>(null);
    const [activeMigrationId, setActiveMigrationId] = useState<string | null>(null);
    const [activeDeploymentId, setActiveDeploymentId] = useState<string | null>(null);

    const { register, handleSubmit, reset } = useForm<CreateClientDto>();

    const { data: client, isLoading } = useQuery({
        queryKey: ['client', id],
        queryFn: () => clientService.findOne(id!),
        enabled: isEditing,
    });

    useEffect(() => {
        if (client) {
            reset(client);
        }
    }, [client, reset]);

    const { data: assessments } = useQuery({
        queryKey: ['client-assessments', id],
        queryFn: () => assessmentService.findByClient(id!),
        enabled: isEditing,
    });

    const { data: migrations } = useQuery({
        queryKey: ['client-migrations', id],
        queryFn: () => migrationService.findByClient(id!),
        enabled: isEditing,
    });

    const { data: deployments } = useQuery({
        queryKey: ['client-deployments', id],
        queryFn: () => deploymentService.findByClient(id!),
        enabled: isEditing,
    });

    const { data: recemVrList } = useQuery({
        queryKey: ['client-recem-vr', id],
        queryFn: () => recemVrService.findByClient(id!),
        enabled: isEditing,
    });

    const mutation = useMutation({
        mutationFn: (data: CreateClientDto) => {
            if (isEditing) {
                return clientService.update(id!, data);
            }
            return clientService.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast({ title: 'Sucesso', description: `Cliente ${isEditing ? 'atualizado' : 'criado'} com sucesso.` });
            navigate('/clients');
        },
        onError: (error) => {
            console.error(error);
            toast({ title: 'Erro', description: 'Falha ao salvar cliente.', variant: 'destructive' });
        },
    });

    const onSubmit = (data: CreateClientDto) => {
        mutation.mutate(data);
    };

    const driveLinkMutation = useMutation({
        mutationFn: (driveLink: string) => clientService.update(id!, { driveLink }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            setDriveLinkDialogOpen(false);
            toast({ title: 'Sucesso', description: 'Link de documentação salvo.' });
        },
        onError: () => toast({ title: 'Erro', description: 'Falha ao salvar o link.', variant: 'destructive' }),
    });

    const openDriveLinkDialog = () => {
        setDriveLinkInput(client?.driveLink || '');
        setDriveLinkDialogOpen(true);
    };

    const isSafeHttpUrl = (value: string) => {
        try {
            const parsed = new URL(value);
            return parsed.protocol === 'https:' || parsed.protocol === 'http:';
        } catch {
            return false;
        }
    };

    const handleSaveDriveLink = () => {
        if (!isSafeHttpUrl(driveLinkInput)) {
            toast({ title: 'URL inválida', description: 'Informe um link http:// ou https:// válido.', variant: 'destructive' });
            return;
        }
        driveLinkMutation.mutate(driveLinkInput);
    };

    const openDriveLink = () => {
        if (client?.driveLink && isSafeHttpUrl(client.driveLink)) {
            window.open(client.driveLink, '_blank', 'noopener,noreferrer');
        }
    };

    const createAssessmentMutation = useMutation({
        mutationFn: () => assessmentService.create({
            clientId: id,
            status: 'rascunho',
            company: {
                nomeFantasia: client?.nomeFantasia,
                cnpj: client?.cnpj,
                lojaNumero: 1,
                lojaTotalLojas: 1,
                contatoNome: client?.contatoNome || '',
                contatoEmail: client?.contatoEmail || '',
                contatoCelular: (client as any)?.contatoCelular || '',
            },
            companyName: client?.nomeFantasia,
            cnpj: client?.cnpj,
        }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['client-assessments', id] });
            setActiveSection('validacoes');
            setActiveAssessment(data);
        },
        onError: () => {
            toast({ title: 'Erro', description: 'Não foi possível criar a validação.', variant: 'destructive' });
        },
    });

    const handleCloseAssessment = async () => {
        if (activeAssessment) {
            try {
                await assessmentService.update(activeAssessment.id, activeAssessment);
            } catch (error) {
                console.error('Erro ao salvar validação', error);
                toast({ title: 'Erro', description: 'Falha ao salvar a validação.', variant: 'destructive' });
            }
        }
        queryClient.invalidateQueries({ queryKey: ['client-assessments', id] });
        setActiveAssessment(null);
    };

    const handleCloseMigration = () => {
        setActiveMigrationId(null);
        queryClient.invalidateQueries({ queryKey: ['client-migrations', id] });
    };

    const handleCloseDeployment = () => {
        setActiveDeploymentId(null);
        queryClient.invalidateQueries({ queryKey: ['client-deployments', id] });
    };

    if (isEditing && isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center p-8">Carregando...</div>
            </DashboardLayout>
        )
    }

    const cadastralForm = (
        <Card>
            <CardHeader>
                <CardTitle>Dados Cadastrais</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
                            <Input id="nomeFantasia" {...register('nomeFantasia', { required: true })} placeholder="Ex: Empresa X" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="razaoSocial">Razão Social</Label>
                            <Input id="razaoSocial" {...register('razaoSocial')} placeholder="Ex: Empresa X LTDA" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cnpj">CNPJ *</Label>
                            <Input id="cnpj" {...register('cnpj', { required: true })} placeholder="00.000.000/0000-00" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endereco">Endereço</Label>
                            <Input id="endereco" {...register('endereco')} placeholder="Rua, número, cidade..." />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <h3 className="font-semibold mb-4">Contato</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contatoNome">Nome do Contato</Label>
                                <Input id="contatoNome" {...register('contatoNome')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contatoEmail">Email</Label>
                                <Input id="contatoEmail" type="email" {...register('contatoEmail')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contatoTelefone">Telefone</Label>
                                <Input id="contatoTelefone" {...register('contatoTelefone')} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => navigate('/clients')}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="gradient-primary" disabled={mutation.isPending}>
                            <Save className="w-4 h-4 mr-2" />
                            {mutation.isPending ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );

    return (
        <DashboardLayout>
            {!isEditing && (
                <div className="flex flex-col gap-6 max-w-3xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-2xl font-bold font-display">Novo Cliente</h1>
                    </div>
                    {cadastralForm}
                </div>
            )}

            {isEditing && (
                <div className="flex flex-col gap-6">
                    <div className="sticky top-0 z-20 -mx-4 lg:-mx-8 bg-card border-b border-border">
                        <div className="px-4 lg:px-8 py-3.5 flex items-center gap-3 flex-wrap">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <h1 className="font-display text-2xl font-bold">{client?.nomeFantasia}</h1>
                            <span className="font-mono text-xs text-muted-foreground">#{id?.slice(0, 8).toUpperCase()}</span>
                            <div className="ml-auto flex items-center gap-2">
                                {client?.driveLink ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={openDriveLink}
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        Documentação
                                    </Button>
                                ) : canSpecial ? (
                                    <Button variant="outline" size="sm" className="gap-2" onClick={openDriveLinkDialog}>
                                        <LinkIcon className="w-4 h-4" />
                                        Adicionar Link
                                    </Button>
                                ) : null}
                                {canViewValidacoes && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => createAssessmentMutation.mutate()}
                                        disabled={createAssessmentMutation.isPending}
                                    >
                                        <FileText className="w-4 h-4" />
                                        Criar Validação
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="px-4 lg:px-8 overflow-x-auto">
                            <div className="flex gap-1 min-w-max">
                                {visibleSections.map((section) => (
                                    <button
                                        key={section.value}
                                        type="button"
                                        onClick={() => setActiveSection(section.value)}
                                        className={cn(
                                            "px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                                            activeSection === section.value
                                                ? "border-primary text-foreground font-semibold"
                                                : "border-transparent text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {section.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8 pb-8">
                        {activeSection === 'dados-cadastrais' && cadastralForm}

                        {activeSection === 'validacoes' && canViewValidacoes && (
                            activeAssessment ? (
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-primary" />
                                            Validação de {new Date(activeAssessment.createdAt).toLocaleDateString('pt-BR')}
                                        </CardTitle>
                                        <Button variant="outline" size="sm" onClick={handleCloseAssessment}>
                                            Voltar à lista
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <AssessmentForm data={activeAssessment} onChange={setActiveAssessment} />
                                    </CardContent>
                                </Card>
                            ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-primary" />
                                        Validações
                                        <span className="font-mono text-xs text-muted-foreground font-normal">{assessments?.length ?? 0}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {assessments && assessments.length > 0 ? (
                                        <div className="space-y-3">
                                            {assessments.map((assessment) => (
                                                <div key={assessment.id} className="flex justify-between items-center p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                    <div>
                                                        <p className="font-medium text-sm">Validado em {new Date(assessment.createdAt).toLocaleDateString('pt-BR')}</p>
                                                        <p className="text-xs text-muted-foreground uppercase">{assessment.status}</p>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => setActiveAssessment(assessment)}>
                                                        Abrir
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma validação encontrada.</p>
                                    )}
                                </CardContent>
                            </Card>
                            )
                        )}

                        {activeSection === 'migracoes' && canViewMigracoes && (
                            activeMigrationId ? (
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="flex items-center gap-2">
                                            <Database className="w-5 h-5 text-primary" />
                                            Migração
                                        </CardTitle>
                                        <Button variant="outline" size="sm" onClick={handleCloseMigration}>
                                            Voltar à lista
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <MigrationForm migrationId={activeMigrationId} embedded onBack={handleCloseMigration} />
                                    </CardContent>
                                </Card>
                            ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Database className="w-5 h-5 text-primary" />
                                        Migrações
                                        <span className="font-mono text-xs text-muted-foreground font-normal">{migrations?.length ?? 0}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {migrations && migrations.length > 0 ? (
                                        <div className="space-y-3">
                                            {migrations.map((migration) => (
                                                <div key={migration.id} className="flex justify-between items-center p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                    <div>
                                                        <p className="font-medium text-sm flex items-center gap-1">
                                                            <Clock className="w-3 h-3 text-muted-foreground" />
                                                            {new Date(migration.createdAt || '').toLocaleDateString('pt-BR')}
                                                            <span className="ml-1 text-xs text-muted-foreground">({migration.tipoMigracao})</span>
                                                        </p>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${migration.status === 'concluida' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                            {MigrationStatusLabels[migration.status] || migration.status}
                                                        </span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => setActiveMigrationId(migration.id)}>
                                                        Abrir
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma migração encontrada.</p>
                                    )}
                                </CardContent>
                            </Card>
                            )
                        )}

                        {activeSection === 'implantacoes' && canViewImplantacoes && (
                            activeDeploymentId ? (
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="flex items-center gap-2">
                                            <MapIcon className="w-5 h-5 text-primary" />
                                            Implantação
                                        </CardTitle>
                                        <Button variant="outline" size="sm" onClick={handleCloseDeployment}>
                                            Voltar à lista
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <DeploymentForm deploymentId={activeDeploymentId} embedded onBack={handleCloseDeployment} />
                                    </CardContent>
                                </Card>
                            ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapIcon className="w-5 h-5 text-primary" />
                                        Implantações
                                        <span className="font-mono text-xs text-muted-foreground font-normal">{deployments?.length ?? 0}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {deployments && deployments.length > 0 ? (
                                        <div className="space-y-3">
                                            {deployments.map((deployment) => (
                                                <div key={deployment.id} className="flex justify-between items-center p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                    <div>
                                                        <p className="font-medium text-sm">{deployment.implantador || 'Sem implantador definido'}</p>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                            {DeploymentStatusLabels[deployment.status]}
                                                        </span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => setActiveDeploymentId(deployment.id)}>
                                                        Abrir
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma implantação encontrada.</p>
                                    )}
                                </CardContent>
                            </Card>
                            )
                        )}

                        {activeSection === 'recem-vr' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <LifeBuoy className="w-5 h-5 text-primary" />
                                        Recém VR
                                        <span className="font-mono text-xs text-muted-foreground font-normal">{recemVrList?.length ?? 0}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {recemVrList && recemVrList.length > 0 ? (
                                        <div className="space-y-3">
                                            {recemVrList.map((recemVr) => (
                                                <div key={recemVr.id} className="flex justify-between items-center p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                    <div>
                                                        <p className="font-medium text-sm">{recemVr.resumo}</p>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                            {RECEM_VR_STATUS_LABELS[recemVr.status]}
                                                        </span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/recem-vr/${recemVr.id}`)}>
                                                        Abrir
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum Recém VR encontrado.</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'tickets' && (
                            <Card>
                                <CardContent className="pt-6">
                                    <ClientTicketsTab clientId={id!} />
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'casos-criticos' && (
                            <Card>
                                <CardContent className="pt-6">
                                    <ClientCriticalCasesTab clientId={id!} />
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'infraestrutura' && (
                            <Card>
                                <CardContent className="pt-6">
                                    <ClientInfrastructureTab clientId={id!} />
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'vault' && (
                            <Card>
                                <CardContent className="pt-6">
                                    <ClientCredentialsTab clientId={id!} />
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'historico' && (
                            (client as any)?.history && (client as any).history.length > 0 ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <HistoryIcon className="w-5 h-5 text-primary" />
                                            Histórico de Alterações
                                            <span className="font-mono text-xs text-muted-foreground font-normal">{(client as any).history.length}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {(client as any).history.map((hist: any) => (
                                                <div key={hist.id} className="flex gap-4 p-3 border rounded-lg bg-card text-sm">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-medium text-foreground">{hist.action}</p>
                                                            <span className="text-muted-foreground text-xs">
                                                                {new Date(hist.createdAt).toLocaleString('pt-BR')}
                                                            </span>
                                                        </div>
                                                        <p className="text-muted-foreground">
                                                            Por: {hist.user?.profile?.fullName || hist.user?.email || 'Sistema'}
                                                        </p>
                                                        {hist.details && (
                                                            <div className="mt-2 text-xs bg-muted/50 p-2 rounded-md space-y-1">
                                                                {(() => {
                                                                    try {
                                                                        const parsed = JSON.parse(hist.details);
                                                                        return Object.entries(parsed).map(([campo, val]: [string, any]) => (
                                                                            <div key={campo} className="flex flex-wrap gap-1">
                                                                                <span className="font-semibold text-foreground">{campo}:</span>
                                                                                <span className="text-red-500 line-through">{typeof val.de === 'object' ? JSON.stringify(val.de) : String(val.de ?? '(vazio)')}</span>
                                                                                <span className="text-muted-foreground">→</span>
                                                                                <span className="text-green-600">{typeof val.para === 'object' ? JSON.stringify(val.para) : String(val.para ?? '(vazio)')}</span>
                                                                            </div>
                                                                        ));
                                                                    } catch (e) {
                                                                        return <span className="text-muted-foreground font-mono break-all">{hist.details}</span>;
                                                                    }
                                                                })()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma alteração registrada ainda.</p>
                            )
                        )}
                    </div>
                </div>
            )}

            <Dialog open={driveLinkDialogOpen} onOpenChange={setDriveLinkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Link de Documentação (Drive)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="driveLinkInput">URL do Drive</Label>
                        <Input
                            id="driveLinkInput"
                            value={driveLinkInput}
                            onChange={(e) => setDriveLinkInput(e.target.value)}
                            placeholder="https://drive.google.com/..."
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={handleSaveDriveLink}
                            disabled={driveLinkMutation.isPending || !driveLinkInput}
                        >
                            {driveLinkMutation.isPending ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

import { useEffect, useState, useRef } from 'react';
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
import { ArrowLeft, Save, FileText, Database, Clock, History as HistoryIcon, MapIcon, LifeBuoy } from 'lucide-react';
import { assessmentService } from '@/services/assessmentService';
import { migrationService, MigrationStatusLabels } from '@/services/migrationService';
import { deploymentService, DeploymentStatusLabels } from '@/services/deploymentService';
import { recemVrService } from '@/services/recemVrService';
import { STATUS_LABELS as RECEM_VR_STATUS_LABELS } from '@/types/recemVr';
import { cn } from '@/lib/utils';
import ClientInfrastructureTab from './ClientInfrastructureTab';
import ClientCredentialsTab from './ClientCredentialsTab';

const SECTIONS = [
    { value: 'dados-cadastrais', label: 'Dados cadastrais' },
    { value: 'validacoes', label: 'Validações' },
    { value: 'migracoes', label: 'Migrações' },
    { value: 'implantacoes', label: 'Implantações' },
    { value: 'recem-vr', label: 'Recém VR' },
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

    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

    useEffect(() => {
        if (!isEditing) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((entry) => entry.isIntersecting);
                if (visible.length === 0) return;
                const top = visible.reduce((best, entry) =>
                    entry.intersectionRatio > best.intersectionRatio ? entry : best
                );
                setActiveSection(top.target.id);
            },
            { rootMargin: '-110px 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
        );

        SECTIONS.forEach((section) => {
            const el = sectionRefs.current[section.value];
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [isEditing, isLoading]);

    const scrollToSection = (value: string) => {
        setActiveSection(value);
        sectionRefs.current[value]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                            <Button
                                variant="outline"
                                size="sm"
                                className="ml-auto gap-2"
                                onClick={() => navigate(`/?clientId=${id}&create=true`)}
                            >
                                <FileText className="w-4 h-4" />
                                Criar Validação
                            </Button>
                        </div>
                        <div className="px-4 lg:px-8 overflow-x-auto">
                            <div className="flex gap-1 min-w-max">
                                {SECTIONS.map((section) => (
                                    <button
                                        key={section.value}
                                        type="button"
                                        onClick={() => scrollToSection(section.value)}
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
                        <section
                            id="dados-cadastrais"
                            ref={(el) => (sectionRefs.current['dados-cadastrais'] = el)}
                            className="scroll-mt-[110px]"
                        >
                            {cadastralForm}
                        </section>

                        <section
                            id="validacoes"
                            ref={(el) => (sectionRefs.current['validacoes'] = el)}
                            className="scroll-mt-[110px]"
                        >
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
                                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/?clientId=${id}&view=${assessment.id}`)}>
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
                        </section>

                        <section
                            id="migracoes"
                            ref={(el) => (sectionRefs.current['migracoes'] = el)}
                            className="scroll-mt-[110px]"
                        >
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
                                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/migration/${migration.id}`)}>
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
                        </section>

                        <section
                            id="implantacoes"
                            ref={(el) => (sectionRefs.current['implantacoes'] = el)}
                            className="scroll-mt-[110px]"
                        >
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
                                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/deployments/${deployment.id}`)}>
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
                        </section>

                        <section
                            id="recem-vr"
                            ref={(el) => (sectionRefs.current['recem-vr'] = el)}
                            className="scroll-mt-[110px]"
                        >
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
                        </section>

                        <section
                            id="infraestrutura"
                            ref={(el) => (sectionRefs.current['infraestrutura'] = el)}
                            className="scroll-mt-[110px]"
                        >
                            <Card>
                                <CardContent className="pt-6">
                                    <ClientInfrastructureTab clientId={id!} />
                                </CardContent>
                            </Card>
                        </section>

                        <section
                            id="vault"
                            ref={(el) => (sectionRefs.current['vault'] = el)}
                            className="scroll-mt-[110px]"
                        >
                            <Card>
                                <CardContent className="pt-6">
                                    <ClientCredentialsTab clientId={id!} />
                                </CardContent>
                            </Card>
                        </section>

                        <section
                            id="historico"
                            ref={(el) => (sectionRefs.current['historico'] = el)}
                            className="scroll-mt-[110px]"
                        >
                            {(client as any)?.history && (client as any).history.length > 0 ? (
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
                            )}
                        </section>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

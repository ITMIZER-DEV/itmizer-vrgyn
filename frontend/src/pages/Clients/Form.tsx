import { useEffect } from 'react';
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
import { ArrowLeft, Save, FileText, Database, Clock, History as HistoryIcon } from 'lucide-react';
import { assessmentService } from '@/services/assessmentService';
import { migrationService, MigrationStatusLabels } from '@/services/migrationService';

export default function ClientForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isEditing = !!id;

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

    if (isEditing && isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center p-8">Carregando...</div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div>
                            <h1 className="text-2xl font-bold font-display">
                                {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
                            </h1>
                            {isEditing && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 gap-2"
                                    onClick={() => navigate(`/?clientId=${id}&create=true`)}
                                >
                                    <FileText className="w-4 h-4" />
                                    Criar Validação
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

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

                {isEditing && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                        {/* Assesssments List */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    Validações (Assessments)
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

                        {/* Migrations List */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="w-5 h-5 text-primary" />
                                    Migrações
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
                    </div>
                )}

                {isEditing && (client as any)?.history && (client as any).history.length > 0 && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HistoryIcon className="w-5 h-5 text-primary" />
                                Histórico de Alterações
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
                )}
            </div>
        </DashboardLayout>
    );
}

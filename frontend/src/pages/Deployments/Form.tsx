import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, CalendarIcon, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";

import { deploymentService, CreateDeploymentDto, DeploymentStatusLabels } from '@/services/deploymentService';
import api from '@/services/api';

interface ClientSearchDto {
    id: string;
    nomeFantasia: string;
    cnpj: string;
}

export default function DeploymentForm() {
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { canEdit, loading: loadingPerms } = usePermissions('/deployments');

    // Estado pro Combobox Look-up do Cliente
    const [openClientCombo, setOpenClientCombo] = useState(false);
    const [clientSearch, setClientSearch] = useState('');
    const [clientOptions, setClientOptions] = useState<ClientSearchDto[]>([]);
    const [isSearchingClient, setIsSearchingClient] = useState(false);
    const [selectedClientName, setSelectedClientName] = useState(''); // apenas para exibição

    // Formulário
    const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } = useForm<CreateDeploymentDto>({
        defaultValues: {
            status: 'ESCOPO'
        }
    });

    // Fetches the deployment
    const { data: deployment, isLoading: isLoadingDeployment } = useQuery({
        queryKey: ['deployment', id],
        queryFn: () => deploymentService.findOne(id!),
        enabled: isEditing,
    });

    useEffect(() => {
        if (deployment) {
            reset({
                clientId: deployment.clientId,
                implantador: deployment.implantador || '',
                dataInicio: deployment.dataInicio ? new Date(deployment.dataInicio) : undefined,
                dataPrevisao: deployment.dataPrevisao ? new Date(deployment.dataPrevisao) : undefined,
                driveDocumentacao: deployment.driveDocumentacao || '',
                observacao: deployment.observacao || '',
                status: deployment.status,
            });
            if (deployment.client) {
                setSelectedClientName(`${deployment.client.nomeFantasia} - ${deployment.client.cnpj}`);
            }
        }
    }, [deployment, reset]);

    // Busca Look-up (Só ativa após 3 letras)
    useEffect(() => {
        const fetchClients = async () => {
            if (clientSearch.length < 4) {
                setClientOptions([]);
                return;
            }
            setIsSearchingClient(true);
            try {
                const res = await api.get<ClientSearchDto[]>(`/clients/search?q=${clientSearch}`);
                setClientOptions(res.data);
            } catch (error) {
                console.error('Erro ao buscar clientes', error);
            } finally {
                setIsSearchingClient(false);
            }
        };

        const timeoutId = setTimeout(fetchClients, 500); // Debounce de 500ms
        return () => clearTimeout(timeoutId);
    }, [clientSearch]);


    const mutation = useMutation({
        mutationFn: (data: CreateDeploymentDto) => {
            if (isEditing) return deploymentService.update(id!, data);
            return deploymentService.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deployments'] });
            toast({ title: 'Sucesso', description: `Implantação ${isEditing ? 'salva' : 'criada'} com sucesso.` });
            navigate('/deployments');
        },
        onError: () => {
            toast({ title: 'Erro', description: 'Ocorreu um erro ao salvar.', variant: 'destructive' });
        }
    });

    const onSubmit = (data: CreateDeploymentDto) => {
        // Validação adicional de URL
        if (data.driveDocumentacao && !data.driveDocumentacao.startsWith('http')) {
            toast({ title: 'Atenção', description: 'O Link do Drive deve ser uma URL válida começando com http ou https', variant: 'destructive' });
            return;
        }

        mutation.mutate(data);
    };

    if (isEditing && isLoadingDeployment || loadingPerms) {
        return <DashboardLayout><div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando dados...</div></DashboardLayout>;
    }

    const isReadOnly = !canEdit;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/deployments')} className="shrink-0 bg-card shadow-sm border border-border">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isEditing ? 'Editar Ficha de Implantação' : 'Nova Ficha de Implantação'}
                        </h1>
                        <p className="text-muted-foreground mt-1">Preencha os dados abaixo.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="bg-card p-6 rounded-xl border border-border space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Look-up Cliente */}
                            <div className="space-y-3">
                                <Label>Cliente *</Label>
                                <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openClientCombo}
                                            disabled={isReadOnly}
                                            className={cn("w-full justify-between h-11", !watch('clientId') && "text-muted-foreground")}
                                        >
                                            {watch('clientId') ? selectedClientName : "Selecione um cliente..."}
                                            <ChevronsUpDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0 border-border" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Digite p/ buscar (mín. 4 letras)..."
                                                value={clientSearch}
                                                onValueChange={setClientSearch}
                                            />
                                            <CommandList>
                                                {isSearchingClient && <div className="p-4 flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...</div>}
                                                {!isSearchingClient && clientSearch.length >= 4 && clientOptions.length === 0 && (
                                                    <CommandEmpty className="p-4 text-center text-sm">Nenhum cliente encontrado.</CommandEmpty>
                                                )}
                                                {!isSearchingClient && clientSearch.length < 4 && (
                                                    <CommandEmpty className="p-4 text-center text-sm text-muted-foreground">Digite pelo menos 4 caracteres para buscar de forma inteligente.</CommandEmpty>
                                                )}
                                                <CommandGroup>
                                                    {clientOptions.map((cli) => (
                                                        <CommandItem
                                                            key={cli.id}
                                                            value={cli.id}
                                                            onSelect={(currentValue) => {
                                                                setValue('clientId', currentValue === watch('clientId') ? "" : cli.id, { shouldValidate: true });
                                                                setSelectedClientName(`${cli.nomeFantasia} - ${cli.cnpj}`);
                                                                setOpenClientCombo(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", watch('clientId') === cli.id ? "opacity-100" : "opacity-0")} />
                                                            {cli.nomeFantasia} <span className="text-muted-foreground ml-2 text-xs">({cli.cnpj})</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {errors.clientId && <span className="text-sm text-destructive font-medium">O cliente é obrigatório.</span>}
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="implantador">Implantador</Label>
                                <Input id="implantador" {...register('implantador')} disabled={isReadOnly} className="h-11" placeholder="Nome do responsável" />
                            </div>

                            <div className="space-y-3 flex flex-col pt-1">
                                <Label className="mb-1">Data de Início</Label>
                                <Controller
                                    control={control}
                                    name="dataInicio"
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant={"outline"} disabled={isReadOnly} className={cn("w-full pl-3 text-left font-normal h-11", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                                                    <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 border-border" align="start">
                                                <Calendar mode="single" selected={field.value as Date} onSelect={field.onChange} disabled={(date) => date < new Date("1900-01-01")} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>

                            <div className="space-y-3 flex flex-col pt-1">
                                <Label className="mb-1">Data Previsão</Label>
                                <Controller
                                    control={control}
                                    name="dataPrevisao"
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant={"outline"} disabled={isReadOnly} className={cn("w-full pl-3 text-left font-normal h-11", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                                                    <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 border-border" align="start">
                                                <Calendar mode="single" selected={field.value as Date} onSelect={field.onChange} disabled={(date) => date < new Date("1900-01-01")} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="drive">Link do GDrive (Documentação)</Label>
                                <Input id="drive" type="url" {...register('driveDocumentacao')} disabled={isReadOnly} className="h-11" placeholder="https://drive.google.com/..." />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="status">Status da Implantação</Label>
                                <Controller
                                    name="status"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange} disabled={isReadOnly}>
                                            <SelectTrigger className="w-full h-11">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(DeploymentStatusLabels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.status && <span className="text-sm text-destructive font-medium">O status é obrigatório.</span>}
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <Label htmlFor="observacao">Observações</Label>
                                <Textarea id="observacao" {...register('observacao')} disabled={isReadOnly} className="min-h-[120px] resize-y" placeholder="Anotações gerais sobre a implantação..." />
                            </div>

                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => navigate('/deployments')} className="min-w-[120px] font-medium">
                            {isReadOnly ? 'Voltar' : 'Cancelar'}
                        </Button>
                        {!isReadOnly && (
                            <Button type="submit" disabled={mutation.isPending} className="gradient-primary min-w-[140px] font-medium gap-2">
                                <Save className="w-4 h-4" />
                                {mutation.isPending ? 'Salvando...' : 'Salvar Ficha'}
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, Check, ChevronsUpDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { recemVrService } from '@/services/recemVrService';
import { clientService } from '@/services/clientService';
import type { CreateRecemVrPayload, RecemVrCriticidade } from '@/types/recemVr';
import { CriticidadeSelector } from '@/components/CriticidadeSelector';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function RecemVrForm() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [clientOpen, setClientOpen] = useState(false);
  const [form, setForm] = useState<CreateRecemVrPayload>({
    clientId: '',
    resumo: '',
    criticidade: 'BAIXA',
    mv067: '',
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: clientService.findAll,
  });

  const selectedClient = clients?.find((c) => c.id === form.clientId);

  const createMutation = useMutation({
    mutationFn: recemVrService.create,
    onSuccess: (data) => {
      toast({
        title: 'Recém VR criado!',
        description: `Solicitação para ${data.client.nomeFantasia} registrada com sucesso.`,
      });
      navigate('/recem-vr');
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível criar a solicitação.', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId) {
      toast({ title: 'Atenção', description: 'Selecione um cliente.', variant: 'destructive' });
      return;
    }
    if (!form.resumo.trim()) {
      toast({ title: 'Atenção', description: 'O resumo é obrigatório.', variant: 'destructive' });
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/recem-vr')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-600" />
              Nova Solicitação Recém VR
            </h1>
            <p className="text-muted-foreground text-sm">Preenchida pelo time de implantação</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">

          {/* CLIENTE — Autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="clientId">Cliente *</Label>
            <Popover open={clientOpen} onOpenChange={setClientOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={clientOpen}
                  className="w-full justify-between font-normal text-left"
                  id="clientId"
                >
                  {selectedClient ? (
                    <span>{selectedClient.nomeFantasia}</span>
                  ) : (
                    <span className="text-muted-foreground">Buscar cliente...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Digite o nome do cliente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {clients?.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.nomeFantasia}
                          onSelect={() => {
                            setForm((f) => ({ ...f, clientId: c.id }));
                            setClientOpen(false);
                          }}
                        >
                          <Check
                            className={cn('mr-2 h-4 w-4', form.clientId === c.id ? 'opacity-100' : 'opacity-0')}
                          />
                          <div>
                            <p className="font-medium">{c.nomeFantasia}</p>
                            <p className="text-xs text-muted-foreground">CNPJ: {c.cnpj}</p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* MV067 — Link Google Drive */}
          <div className="space-y-2">
            <Label htmlFor="mv067">
              Termo de Encerramento — MV067
              <span className="ml-1 text-xs text-muted-foreground font-normal">(link do Google Drive)</span>
            </Label>
            <div className="relative">
              <Input
                id="mv067"
                type="url"
                placeholder="https://drive.google.com/..."
                value={form.mv067 ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, mv067: e.target.value }))}
                className="pr-9"
              />
              {form.mv067 && (
                <a
                  href={form.mv067}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-emerald-600"
                  tabIndex={-1}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* CRITICIDADE */}
          <div className="space-y-2">
            <Label>Criticidade *</Label>
            <CriticidadeSelector
              value={form.criticidade ?? 'BAIXA'}
              onChange={(v) => setForm((f) => ({ ...f, criticidade: v }))}
            />
          </div>

          {/* RESUMO */}
          <div className="space-y-2">
            <Label htmlFor="resumo">
              Resumo da Situação *
              <span className="ml-1 text-xs text-muted-foreground font-normal">(obrigatório)</span>
            </Label>
            <Textarea
              id="resumo"
              placeholder="Descreva a situação do cliente, pontos de atenção, histórico relevante da implantação..."
              value={form.resumo}
              onChange={(e) => setForm((f) => ({ ...f, resumo: e.target.value }))}
              className="min-h-[120px]"
            />
          </div>

          {/* AÇÕES */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate('/recem-vr')} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {createMutation.isPending ? 'Criando...' : 'Criar Solicitação'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

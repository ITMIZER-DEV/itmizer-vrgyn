import { ServerData, ServerType } from '@/types/assessment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Server, Plus, Trash2, Database, AppWindow, Settings } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { validateServer, getOverallStatus } from '@/utils/validation';

interface ServersStepProps {
  data: ServerData[];
  onChange: (data: ServerData[]) => void;
  isReadOnly?: boolean;
}

const serverTypeLabels: Record<ServerType, { label: string; icon: typeof Server }> = {
  database: { label: 'Banco de Dados', icon: Database },
  application: { label: 'Aplicação', icon: AppWindow },
  service_manager: { label: 'Service Manager', icon: Settings },
};

export function ServersStep({ data, onChange, isReadOnly }: ServersStepProps) {
  const addServer = () => {
    if (isReadOnly) return;
    const newServer: ServerData = {
      id: crypto.randomUUID(),
      tipo: 'application',
      processador: '',
      memoriaRam: '',
      discoTotal: '',
      discoLivre: '',
      sistemaOperacional: '',
      isVm: false,
      tempoUso: '',
      aplicacoesAtuais: '',
    };
    onChange([...data, newServer]);
  };

  const removeServer = (id: string) => {
    if (isReadOnly) return;
    onChange(data.filter(s => s.id !== id));
  };

  const updateServer = (id: string, field: keyof ServerData, value: string | boolean) => {
    if (isReadOnly) return;
    onChange(
      data.map(s => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-semibold flex items-center gap-2">
          <Server className="w-6 h-6 text-primary" />
          Servidores ({data?.length || 0})
        </h2>
        {!isReadOnly && (
          <Button onClick={addServer} className="gradient-primary">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Servidor
          </Button>
        )}
      </div>

      {(!data || data.length === 0) ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum servidor cadastrado</p>
            {!isReadOnly && (
              <Button variant="outline" className="mt-4" onClick={addServer}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar primeiro servidor
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        data?.map((server, index) => {
          const validations = validateServer(server);
          const status = getOverallStatus(validations);

          return (
            <Card key={server.id} className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg font-display">
                  Servidor {index + 1}
                  {server.memoriaRam && <StatusBadge status={status} />}
                </CardTitle>
                {!isReadOnly && (
                  <Button variant="ghost" size="sm" onClick={() => removeServer(server.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Servidor</Label>
                  <Select value={server.tipo} onValueChange={(v) => updateServer(server.id, 'tipo', v)}>
                    <SelectTrigger disabled={isReadOnly}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="database">Banco de Dados</SelectItem>
                      <SelectItem value="application">Aplicação</SelectItem>
                      <SelectItem value="service_manager">Service Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Processador</Label>
                  <Input
                    disabled={isReadOnly}
                    value={server.processador}
                    onChange={e => updateServer(server.id, 'processador', e.target.value)}
                    placeholder="Ex: Intel Xeon E5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Memória RAM</Label>
                  <Input
                    disabled={isReadOnly}
                    value={server.memoriaRam}
                    onChange={e => updateServer(server.id, 'memoriaRam', e.target.value)}
                    placeholder="Ex: 16GB"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sistema Operacional</Label>
                  <Input
                    disabled={isReadOnly}
                    value={server.sistemaOperacional}
                    onChange={e => updateServer(server.id, 'sistemaOperacional', e.target.value)}
                    placeholder="Ex: Windows Server 2019"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Disco Total</Label>
                  <Input
                    disabled={isReadOnly}
                    value={server.discoTotal}
                    onChange={e => updateServer(server.id, 'discoTotal', e.target.value)}
                    placeholder="Ex: 500GB"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Disco Livre</Label>
                  <Input
                    disabled={isReadOnly}
                    value={server.discoLivre}
                    onChange={e => updateServer(server.id, 'discoLivre', e.target.value)}
                    placeholder="Ex: 200GB"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tempo de Uso</Label>
                  <Input
                    disabled={isReadOnly}
                    value={server.tempoUso}
                    onChange={e => updateServer(server.id, 'tempoUso', e.target.value)}
                    placeholder="Ex: 2 anos"
                  />
                </div>
                <div className="flex items-center gap-4 md:col-span-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      disabled={isReadOnly}
                      checked={server.isVm}
                      onCheckedChange={v => updateServer(server.id, 'isVm', v)}
                    />
                    <Label>Máquina Virtual (VM)</Label>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>Aplicações Atuais</Label>
                  <Textarea
                    disabled={isReadOnly}
                    value={server.aplicacoesAtuais}
                    onChange={e => updateServer(server.id, 'aplicacoesAtuais', e.target.value)}
                    placeholder="Liste as aplicações instaladas..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

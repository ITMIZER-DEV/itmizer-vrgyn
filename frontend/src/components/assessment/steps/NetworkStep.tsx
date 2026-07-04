import { NetworkData } from '@/types/assessment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Network, Plus, Trash2, Shield } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NetworkStepProps {
  data: NetworkData;
  onChange: (data: NetworkData) => void;
  isReadOnly?: boolean;
}

export function NetworkStep({ data, onChange, isReadOnly }: NetworkStepProps) {
  const handleLinkChange = (index: number, field: string, value: string | boolean) => {
    if (isReadOnly) return;
    const newLinks = [...data.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    onChange({ ...data, links: newLinks });
  };

  const addLink = () => {
    if (isReadOnly) return;
    onChange({
      ...data,
      links: [...data.links, { provedor: '', velocidade: '', dedicado: false, ipFixo: false }],
    });
  };

  const removeLink = (index: number) => {
    if (isReadOnly) return;
    onChange({
      ...data,
      links: data.links.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Network className="w-5 h-5 text-primary" />
            Links de Internet
          </CardTitle>
          {!isReadOnly && (
            <Button variant="outline" size="sm" onClick={addLink}>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Link
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {data.links.map((link, index) => (
            <div key={index} className="p-4 rounded-lg bg-muted/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Link {index + 1}</span>
                {data.links.length > 1 && !isReadOnly && (
                  <Button variant="ghost" size="sm" onClick={() => removeLink(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Provedor</Label>
                  <Input
                    disabled={isReadOnly}
                    value={link.provedor}
                    onChange={e => handleLinkChange(index, 'provedor', e.target.value)}
                    placeholder="Ex: Vivo, Claro"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Velocidade</Label>
                  <Input
                    disabled={isReadOnly}
                    value={link.velocidade}
                    onChange={e => handleLinkChange(index, 'velocidade', e.target.value)}
                    placeholder="Ex: 100 Mbps"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      disabled={isReadOnly}
                      checked={link.dedicado}
                      onCheckedChange={v => handleLinkChange(index, 'dedicado', v)}
                    />
                    <Label className="text-sm">Dedicado</Label>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={link.ipFixo}
                    onCheckedChange={v => handleLinkChange(index, 'ipFixo', v)}
                  />
                  <Label className="text-sm">IP Fixo</Label>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Shield className="w-5 h-5 text-primary" />
            Segurança & Configuração PDV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label>Firewall</Label>
              <Switch
                checked={data.firewall}
                onCheckedChange={v => onChange({ ...data, firewall: v })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label>Proxy</Label>
              <Switch
                checked={data.proxy}
                onCheckedChange={v => onChange({ ...data, proxy: v })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label>Antivírus nos PDVs</Label>
              <Switch
                checked={data.antivirusPdv}
                onCheckedChange={v => onChange({ ...data, antivirusPdv: v })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label>PDVs no Domínio</Label>
              <Switch
                checked={data.pdvNoDominio}
                onCheckedChange={v => onChange({ ...data, pdvNoDominio: v })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label>IP Fixo nos PDVs</Label>
              <Switch
                checked={data.ipFixoPdv}
                onCheckedChange={v => onChange({ ...data, ipFixoPdv: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Conexão PDV</Label>
              <Select
                value={data.tipoConexaoPdv}
                onValueChange={v => onChange({ ...data, tipoConexaoPdv: v })}
              >
                <SelectTrigger disabled={isReadOnly}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cabo">Cabo (Ethernet)</SelectItem>
                  <SelectItem value="wifi">Wi-Fi</SelectItem>
                  <SelectItem value="misto">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

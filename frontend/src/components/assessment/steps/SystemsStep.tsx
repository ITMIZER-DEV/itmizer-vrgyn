import { SystemsData } from '@/types/assessment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Database, Link } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SystemsStepProps {
  data: SystemsData;
  onChange: (data: SystemsData) => void;
  isReadOnly?: boolean;
}

export function SystemsStep({ data, onChange, isReadOnly }: SystemsStepProps) {
  const handleChange = (field: keyof SystemsData, value: any) => {
    if (isReadOnly) return;
    onChange({ ...data, [field]: value });
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Settings className="w-5 h-5 text-primary" />
            Sistema PDV Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Sistema em Uso</Label>
            <Input
              disabled={isReadOnly}
              value={data.sistemaPdvAtual}
              onChange={e => handleChange('sistemaPdvAtual', e.target.value)}
              placeholder="Ex: Linx, TOTVS, SAP"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Database className="w-5 h-5 text-primary" />
            Banco de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Banco</Label>
              <Select
                disabled={isReadOnly}
                value={data.bancoTipo}
                onValueChange={v => handleChange('bancoTipo', v)}
              >
                <SelectTrigger disabled={isReadOnly}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sql-server">SQL Server</SelectItem>
                  <SelectItem value="oracle">Oracle</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="firebird">Firebird</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hospedagem</Label>
              <Select
                disabled={isReadOnly}
                value={data.bancoHospedagem}
                onValueChange={v => handleChange('bancoHospedagem', v)}
              >
                <SelectTrigger disabled={isReadOnly}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local (On-Premise)</SelectItem>
                  <SelectItem value="cloud">Cloud</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label>Acesso às Credenciais</Label>
              <Switch
                disabled={isReadOnly}
                checked={data.acessoCredenciais}
                onCheckedChange={v => handleChange('acessoCredenciais', v)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label>Acesso ao Backup</Label>
              <Switch
                disabled={isReadOnly}
                checked={data.acessoBackup}
                onCheckedChange={v => handleChange('acessoBackup', v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Link className="w-5 h-5 text-primary" />
            Integrações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label>CRM</Label>
              <Switch
                disabled={isReadOnly}
                checked={data.integracaoCrm}
                onCheckedChange={v => handleChange('integracaoCrm', v)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label>E-commerce</Label>
              <Switch
                disabled={isReadOnly}
                checked={data.integracaoEcommerce}
                onCheckedChange={v => handleChange('integracaoEcommerce', v)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label>M-commerce</Label>
              <Switch
                disabled={isReadOnly}
                checked={data.integracaoMcommerce}
                onCheckedChange={v => handleChange('integracaoMcommerce', v)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Customizações Necessárias</Label>
            <Textarea
              disabled={isReadOnly}
              value={data.customizacoesNecessarias}
              onChange={e => handleChange('customizacoesNecessarias', e.target.value)}
              placeholder="Descreva as customizações necessárias..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Homologações Necessárias</Label>
            <Textarea
              disabled={isReadOnly}
              value={data.homologacoesNecessarias}
              onChange={e => handleChange('homologacoesNecessarias', e.target.value)}
              placeholder="Descreva as homologações necessárias..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

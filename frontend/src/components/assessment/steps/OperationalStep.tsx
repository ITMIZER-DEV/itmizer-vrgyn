import { OperationalData } from '@/types/assessment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Clock, Plus, Trash2, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface OperationalStepProps {
  data: OperationalData;
  onChange: (data: OperationalData) => void;
  isReadOnly?: boolean;
}

const diasSemana = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export function OperationalStep({ data, onChange, isReadOnly }: OperationalStepProps) {
  const addExpediente = () => {
    if (isReadOnly) return;
    onChange({
      ...data,
      expediente: [
        ...data.expediente,
        { dia: '', abertura: '', fechamento: '', pdvsAbertura: 0, pdvsFechamento: 0 },
      ],
    });
  };

  const updateExpediente = (index: number, field: string, value: string | number) => {
    if (isReadOnly) return;
    const newExpediente = [...data.expediente];
    newExpediente[index] = { ...newExpediente[index], [field]: value };
    onChange({ ...data, expediente: newExpediente });
  };

  const removeExpediente = (index: number) => {
    if (isReadOnly) return;
    onChange({
      ...data,
      expediente: data.expediente.filter((_, i) => i !== index),
    });
  };

  const toggleDiaPico = (dia: string) => {
    if (isReadOnly) return;
    const newDias = data.diasPico.includes(dia)
      ? data.diasPico.filter(d => d !== dia)
      : [...data.diasPico, dia];
    onChange({ ...data, diasPico: newDias });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Clock className="w-5 h-5 text-primary" />
            Expediente
          </CardTitle>
          {!isReadOnly && (
            <Button variant="outline" size="sm" onClick={addExpediente}>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Dia
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {data.expediente.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum expediente configurado
            </p>
          ) : (
            data.expediente.map((exp, index) => (
              <div key={index} className="p-4 rounded-lg bg-muted/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Dia {index + 1}</span>
                  {!isReadOnly && (
                    <Button variant="ghost" size="sm" onClick={() => removeExpediente(index)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Dia</Label>
                    <Select
                      disabled={isReadOnly}
                      value={exp.dia}
                      onValueChange={v => updateExpediente(index, 'dia', v)}
                    >
                      <SelectTrigger disabled={isReadOnly}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {diasSemana.map(dia => (
                          <SelectItem key={dia} value={dia}>{dia}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Abertura</Label>
                    <Input
                      disabled={isReadOnly}
                      type="time"
                      value={exp.abertura}
                      onChange={e => updateExpediente(index, 'abertura', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fechamento</Label>
                    <Input
                      disabled={isReadOnly}
                      type="time"
                      value={exp.fechamento}
                      onChange={e => updateExpediente(index, 'fechamento', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PDVs Abertura</Label>
                    <Input
                      disabled={isReadOnly}
                      type="number"
                      min={0}
                      value={exp.pdvsAbertura}
                      onChange={e => updateExpediente(index, 'pdvsAbertura', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PDVs Fechamento</Label>
                    <Input
                      disabled={isReadOnly}
                      type="number"
                      min={0}
                      value={exp.pdvsFechamento}
                      onChange={e => updateExpediente(index, 'pdvsFechamento', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Users className="w-5 h-5 text-primary" />
            Operação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-3 block">Dias de Pico</Label>
            <div className="flex flex-wrap gap-3">
              {diasSemana.map(dia => (
                <label
                  key={dia}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    disabled={isReadOnly}
                    checked={data.diasPico.includes(dia)}
                    onCheckedChange={() => toggleDiaPico(dia)}
                  />
                  <span className="text-sm">{dia}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Operadores por Turno</Label>
              <Input
                disabled={isReadOnly}
                type="number"
                min={0}
                value={data.operadoresPorTurno}
                onChange={e => {
                  if (isReadOnly) return;
                  onChange({ ...data, operadoresPorTurno: parseInt(e.target.value) || 0 });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Forma de Login no PDV</Label>
              <Select
                disabled={isReadOnly}
                value={data.formaLoginPdv}
                onValueChange={v => {
                  if (isReadOnly) return;
                  onChange({ ...data, formaLoginPdv: v });
                }}
              >
                <SelectTrigger disabled={isReadOnly}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="senha">Senha</SelectItem>
                  <SelectItem value="biometria">Biometria</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="misto">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label>Usa Fundo de Caixa</Label>
              <Switch
                disabled={isReadOnly}
                checked={data.usaFundoCaixa}
                onCheckedChange={v => {
                  if (isReadOnly) return;
                  onChange({ ...data, usaFundoCaixa: v });
                }}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label>Usa Sangria</Label>
              <Switch
                disabled={isReadOnly}
                checked={data.usaSangria}
                onCheckedChange={v => {
                  if (isReadOnly) return;
                  onChange({ ...data, usaSangria: v });
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

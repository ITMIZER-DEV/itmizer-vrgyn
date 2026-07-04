import { PDVData } from '@/types/assessment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Monitor, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { validatePDV, getOverallStatus } from '@/utils/validation';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PDVsStepProps {
  data: PDVData[];
  onChange: (data: PDVData[]) => void;
  isReadOnly?: boolean;
}

export function PDVsStep({ data, onChange, isReadOnly }: PDVsStepProps) {
  const [expandedPdvs, setExpandedPdvs] = useState<string[]>([]);

  const addPDV = () => {
    if (isReadOnly) return;
    const newPDV: PDVData = {
      id: crypto.randomUUID(),
      quantidade: 1,
      sistemaOperacional: '',
      licenca: '',
      processador: '',
      memoriaRam: '',
      disco: '',
      tempoUso: '',
      usaNfce: false,
      satMarca: '',
      satModelo: '',
      satAtivo: false,
      impressora: '',
      teclado: '',
      balanca: '',
      scanner: '',
      pinpad: '',
      biometria: '',
      tipoPdv: 'Padrao',
    };
    onChange([...data, newPDV]);
    setExpandedPdvs([...expandedPdvs, newPDV.id]);
  };

  const removePDV = (id: string) => {
    if (isReadOnly) return;
    onChange(data.filter(p => p.id !== id));
    setExpandedPdvs(expandedPdvs.filter(i => i !== id));
  };

  const updatePDV = (id: string, field: keyof PDVData, value: string | boolean | number) => {
    if (isReadOnly) return;
    onChange(
      data.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedPdvs(
      expandedPdvs.includes(id)
        ? expandedPdvs.filter(i => i !== id)
        : [...expandedPdvs, id]
    );
  };
  const totalPDVs = (data || []).reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-semibold flex items-center gap-2">
          <Monitor className="w-6 h-6 text-primary" />
          PDVs ({totalPDVs})
        </h2>
        {!isReadOnly && (
          <Button onClick={addPDV} className="gradient-primary">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar PDV
          </Button>
        )}
      </div>

      {(!data || data.length === 0) ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Monitor className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum PDV cadastrado</p>
            {!isReadOnly && (
              <Button variant="outline" className="mt-4" onClick={addPDV}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar primeiro PDV
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        data?.map((pdv, index) => {
          const validations = validatePDV(pdv);
          const status = getOverallStatus(validations);
          const isExpanded = expandedPdvs.includes(pdv.id);

          return (
            <Collapsible key={pdv.id} open={isExpanded} onOpenChange={() => toggleExpand(pdv.id)}>
              <Card className="glass-card">
                <CollapsibleTrigger asChild>
                  <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
                    <CardTitle className="flex items-center gap-2 text-lg font-display">
                      PDV {index + 1}
                      {pdv.memoriaRam && <StatusBadge status={status} />}
                      {pdv.usaNfce && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">NFC-e</span>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {!isReadOnly && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removePDV(pdv.id); }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-primary font-semibold">Quantidade de PDVs</Label>
                        <Input
                          disabled={isReadOnly}
                          type="number"
                          min="1"
                          value={pdv.quantidade || 1}
                          onChange={e => updatePDV(pdv.id, 'quantidade', Number(e.target.value))}
                          placeholder="Ex: 5"
                          className="font-semibold text-lg"
                        />
                        <p className="text-xs text-muted-foreground">
                          Quantos PDVs possuem esta configuração
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo PDV</Label>
                        <Select
                          value={pdv.tipoPdv || 'Padrao'}
                          onValueChange={v => updatePDV(pdv.id, 'tipoPdv', v)}
                        >
                          <SelectTrigger disabled={isReadOnly}>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Padrao">Padrão</SelectItem>
                            <SelectItem value="Touch">Touch</SelectItem>
                            <SelectItem value="Hibrido">Híbrido</SelectItem>
                            <SelectItem value="Selfcheckout">Selfcheckout</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Sistema Operacional</Label>
                        <Input
                          disabled={isReadOnly}
                          value={pdv.sistemaOperacional}
                          onChange={e => updatePDV(pdv.id, 'sistemaOperacional', e.target.value)}
                          placeholder="Ex: Windows 10 Pro"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Licença</Label>
                        <Input
                          disabled={isReadOnly}
                          value={pdv.licenca}
                          onChange={e => updatePDV(pdv.id, 'licenca', e.target.value)}
                          placeholder="Ex: OEM, Retail"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Processador</Label>
                        <Input
                          disabled={isReadOnly}
                          value={pdv.processador}
                          onChange={e => updatePDV(pdv.id, 'processador', e.target.value)}
                          placeholder="Ex: Intel Core i3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Memória RAM</Label>
                        <Input
                          disabled={isReadOnly}
                          value={pdv.memoriaRam}
                          onChange={e => updatePDV(pdv.id, 'memoriaRam', e.target.value)}
                          placeholder="Ex: 8GB"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Disco</Label>
                        <Input
                          disabled={isReadOnly}
                          value={pdv.disco}
                          onChange={e => updatePDV(pdv.id, 'disco', e.target.value)}
                          placeholder="Ex: 240GB SSD"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tempo de Uso</Label>
                        <Input
                          disabled={isReadOnly}
                          value={pdv.tempoUso}
                          onChange={e => updatePDV(pdv.id, 'tempoUso', e.target.value)}
                          placeholder="Ex: 1 ano"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          disabled={isReadOnly}
                          checked={pdv.usaNfce}
                          onCheckedChange={v => updatePDV(pdv.id, 'usaNfce', v)}
                        />
                        <Label>Utiliza NFC-e</Label>
                      </div>
                    </div>

                    {pdv.usaNfce && (
                      <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                        <h4 className="font-medium">Configuração S@T</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Marca</Label>
                            <Input
                          disabled={isReadOnly}
                              value={pdv.satMarca}
                              onChange={e => updatePDV(pdv.id, 'satMarca', e.target.value)}
                              placeholder="Ex: Elgin, Bematech"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Modelo</Label>
                            <Input
                          disabled={isReadOnly}
                              value={pdv.satModelo}
                              onChange={e => updatePDV(pdv.id, 'satModelo', e.target.value)}
                              placeholder="Modelo do S@T"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                          disabled={isReadOnly}
                              checked={pdv.satAtivo}
                              onCheckedChange={v => updatePDV(pdv.id, 'satAtivo', v)}
                            />
                            <Label>S@T Ativo</Label>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                      <h4 className="font-medium">Periféricos do PDV</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Impressora</Label>
                          <Input
                          disabled={isReadOnly}
                            value={pdv.impressora}
                            onChange={e => updatePDV(pdv.id, 'impressora', e.target.value)}
                            placeholder="Marca/Modelo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Teclado</Label>
                          <Input
                          disabled={isReadOnly}
                            value={pdv.teclado}
                            onChange={e => updatePDV(pdv.id, 'teclado', e.target.value)}
                            placeholder="Tipo/Modelo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Balança</Label>
                          <Input
                          disabled={isReadOnly}
                            value={pdv.balanca}
                            onChange={e => updatePDV(pdv.id, 'balanca', e.target.value)}
                            placeholder="Marca/Modelo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Scanner</Label>
                          <Input
                          disabled={isReadOnly}
                            value={pdv.scanner}
                            onChange={e => updatePDV(pdv.id, 'scanner', e.target.value)}
                            placeholder="Marca/Modelo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Pinpad</Label>
                          <Input
                          disabled={isReadOnly}
                            value={pdv.pinpad}
                            onChange={e => updatePDV(pdv.id, 'pinpad', e.target.value)}
                            placeholder="Marca/Modelo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Biometria</Label>
                          <Input
                          disabled={isReadOnly}
                            value={pdv.biometria}
                            onChange={e => updatePDV(pdv.id, 'biometria', e.target.value)}
                            placeholder="Marca/Modelo"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })
      )}
    </div>
  );
}

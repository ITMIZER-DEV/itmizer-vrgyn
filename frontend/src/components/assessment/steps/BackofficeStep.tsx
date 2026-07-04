import { BackofficeData } from '@/types/assessment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface BackofficeStepProps {
    data: BackofficeData[];
    onChange: (data: BackofficeData[]) => void;
    isReadOnly?: boolean;
}

export function BackofficeStep({ data, onChange, isReadOnly }: BackofficeStepProps) {
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const addItem = () => {
        if (isReadOnly) return;
        const currentData = data || [];
        const newItem: BackofficeData = {
            id: crypto.randomUUID(),
            quantidade: 1,
            funcao: '',
            processador: '',
            memoriaRam: '',
            disco: '',
            sistemaOperacional: '',
        };
        onChange([...currentData, newItem]);
        setExpandedItems([...expandedItems, newItem.id]);
    };

    const removeItem = (id: string) => {
        if (isReadOnly) return;
        const currentData = data || [];
        onChange(currentData.filter(p => p.id !== id));
        setExpandedItems(expandedItems.filter(i => i !== id));
    };

    const updateItem = (id: string, field: keyof BackofficeData, value: string | number) => {
        if (isReadOnly) return;
        const currentData = data || [];
        onChange(
            currentData.map(p => (p.id === id ? { ...p, [field]: value } : p))
        );
    };

    const toggleExpand = (id: string) => {
        setExpandedItems(
            expandedItems.includes(id)
                ? expandedItems.filter(i => i !== id)
                : [...expandedItems, id]
        );
    };
    const totalEstacoes = (data || []).reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                    <Monitor className="w-6 h-6 text-primary" />
                    Retaguarda ({totalEstacoes})
                </h2>
                {!isReadOnly && (
                    <Button onClick={addItem} className="gradient-primary">
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Computador
                    </Button>
                )}
            </div>

            {(!data || data.length === 0) ? (
                <Card className="glass-card">
                    <CardContent className="py-12 text-center">
                        <Monitor className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Nenhum computador de retaguarda cadastrado</p>
                        {!isReadOnly && (
                            <Button variant="outline" className="mt-4" onClick={addItem}>
                                <Plus className="w-4 h-4 mr-1" />
                                Adicionar primeiro computador
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                data?.map((item, index) => {
                    const isExpanded = expandedItems.includes(item.id);

                    return (
                        <Collapsible key={item.id} open={isExpanded} onOpenChange={() => toggleExpand(item.id)}>
                            <Card className="glass-card">
                                <CollapsibleTrigger asChild>
                                    <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
                                        <CardTitle className="flex items-center gap-2 text-lg font-display">
                                            Computador {index + 1} {item.funcao && `- ${item.funcao}`}
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            {!isReadOnly && (
                                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}>
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            )}
                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </div>
                                    </CardHeader>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-primary font-semibold">Quantidade de Estações</Label>
                                                <Input
                                                    disabled={isReadOnly}
                                                    type="number"
                                                    min="1"
                                                    value={item.quantidade || 1}
                                                    onChange={e => updateItem(item.id, 'quantidade', Number(e.target.value))}
                                                    placeholder="Ex: 3"
                                                    className="font-semibold text-lg"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Quantas estações de retaguarda possuem esta configuração
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Função / Setor</Label>
                                                <Input
                                                    disabled={isReadOnly}
                                                    value={item.funcao}
                                                    onChange={e => updateItem(item.id, 'funcao', e.target.value)}
                                                    placeholder="Ex: Lançamento de Notas, Financeiro, Frente de Caixa"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Sistema Operacional</Label>
                                                <Input
                                                    disabled={isReadOnly}
                                                    value={item.sistemaOperacional}
                                                    onChange={e => updateItem(item.id, 'sistemaOperacional', e.target.value)}
                                                    placeholder="Ex: Windows 10 Pro"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Processador</Label>
                                                <Input
                                                    disabled={isReadOnly}
                                                    value={item.processador}
                                                    onChange={e => updateItem(item.id, 'processador', e.target.value)}
                                                    placeholder="Ex: Intel Core i3"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Memória RAM</Label>
                                                <Input
                                                    disabled={isReadOnly}
                                                    value={item.memoriaRam}
                                                    onChange={e => updateItem(item.id, 'memoriaRam', e.target.value)}
                                                    placeholder="Ex: 8GB"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Disco (HD / SSD)</Label>
                                                <Input
                                                    disabled={isReadOnly}
                                                    value={item.disco}
                                                    onChange={e => updateItem(item.id, 'disco', e.target.value)}
                                                    placeholder="Ex: 240GB SSD"
                                                />
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

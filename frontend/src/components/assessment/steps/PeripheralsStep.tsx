import { PeripheralData } from '@/types/assessment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Plus, X, Barcode, Package } from 'lucide-react';

interface PeripheralsStepProps {
  data: PeripheralData;
  onChange: (data: PeripheralData) => void;
  isReadOnly?: boolean;
}

interface PeripheralListProps {
  title: string;
  icon: React.ElementType;
  field: keyof PeripheralData;
  placeholder: string;
  items: string[];
  isReadOnly?: boolean;
  onAdd: (field: keyof PeripheralData) => void;
  onUpdate: (field: keyof PeripheralData, index: number, value: string) => void;
  onRemove: (field: keyof PeripheralData, index: number) => void;
}

function PeripheralList({ title, icon: Icon, field, placeholder, items, isReadOnly, onAdd, onUpdate, onRemove }: PeripheralListProps) {
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg font-display">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        {!isReadOnly && (
          <Button variant="outline" size="sm" onClick={() => onAdd(field)}>
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum item cadastrado
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  disabled={isReadOnly}
                  value={item}
                  onChange={e => onUpdate(field, index, e.target.value)}
                  placeholder={placeholder}
                />
                {!isReadOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(field, index)}
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PeripheralsStep({ data, onChange, isReadOnly }: PeripheralsStepProps) {
  const addItem = (field: keyof PeripheralData) => {
    if (isReadOnly) return;
    onChange({
      ...data,
      [field]: [...data[field], ''],
    });
  };

  const updateItem = (field: keyof PeripheralData, index: number, value: string) => {
    if (isReadOnly) return;
    const newItems = [...data[field]];
    newItems[index] = value;
    onChange({
      ...data,
      [field]: newItems,
    });
  };

  const removeItem = (field: keyof PeripheralData, index: number) => {
    if (isReadOnly) return;
    onChange({
      ...data,
      [field]: data[field].filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-display font-semibold flex items-center gap-2">
        <Printer className="w-6 h-6 text-primary" />
        Periféricos da Loja
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PeripheralList
          title="Impressoras de Etiqueta"
          icon={Printer}
          field="impressorasEtiqueta"
          placeholder="Marca/Modelo"
          items={data.impressorasEtiqueta}
          isReadOnly={isReadOnly}
          onAdd={addItem}
          onUpdate={updateItem}
          onRemove={removeItem}
        />
        <PeripheralList
          title="Consulta de Preço"
          icon={Barcode}
          field="consultaPreco"
          placeholder="Marca/Modelo"
          items={data.consultaPreco}
          isReadOnly={isReadOnly}
          onAdd={addItem}
          onUpdate={updateItem}
          onRemove={removeItem}
        />
        <PeripheralList
          title="Coletores de Dados"
          icon={Package}
          field="coletoresDados"
          placeholder="Marca/Modelo"
          items={data.coletoresDados}
          isReadOnly={isReadOnly}
          onAdd={addItem}
          onUpdate={updateItem}
          onRemove={removeItem}
        />
        <PeripheralList
          title="Outros Equipamentos"
          icon={Package}
          field="outros"
          placeholder="Descrição do equipamento"
          items={data.outros}
          isReadOnly={isReadOnly}
          onAdd={addItem}
          onUpdate={updateItem}
          onRemove={removeItem}
        />
      </div>
    </div>
  );
}

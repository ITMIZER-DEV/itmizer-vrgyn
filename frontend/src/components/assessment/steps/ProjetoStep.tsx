import { ProjetoData, ProjetoUsuario } from '@/types/assessment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, User, Clock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjetoStepProps {
  data: ProjetoData;
  onChange: (data: ProjetoData) => void;
  isReadOnly?: boolean;
}

export function ProjetoStep({ data, onChange, isReadOnly }: ProjetoStepProps) {
  const handleChange = (field: keyof ProjetoData, value: any) => {
    if (isReadOnly) return;
    onChange({ ...data, [field]: value });
  };

  const handleAddUsuario = () => {
    if (isReadOnly) return;
    const novosUsuarios = [...(data.usuarios || []), { id: crypto.randomUUID(), nome: '', telefone: '', funcao: '' }];
    handleChange('usuarios', novosUsuarios);
  };

  const handleRemoveUsuario = (id: string) => {
    if (isReadOnly) return;
    const novosUsuarios = (data.usuarios || []).filter(u => u.id !== id);
    handleChange('usuarios', novosUsuarios);
  };

  const handleChangeUsuario = (id: string, field: keyof ProjetoUsuario, value: string) => {
    if (isReadOnly) return;
    const novosUsuarios = (data.usuarios || []).map(u =>
      u.id === id ? { ...u, [field]: value } : u
    );
    handleChange('usuarios', novosUsuarios);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Briefcase className="w-5 h-5 text-primary" />
            Dados Gerais do Projeto
          </CardTitle>
          <CardDescription>
            Informações sobre o escopo e planejamento do projeto de implantação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidadeHoras" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Quantidade de Horas
              </Label>
              <Input
                disabled={isReadOnly}
                id="quantidadeHoras"
                type="number"
                min="0"
                value={data.quantidadeHoras || ''}
                onChange={e => handleChange('quantidadeHoras', Number(e.target.value))}
                placeholder="Ex: 40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="escopoImplantacao">Escopo de Implantação</Label>
            <Textarea
              disabled={isReadOnly}
              id="escopoImplantacao"
              value={data.escopoImplantacao || ''}
              onChange={e => handleChange('escopoImplantacao', e.target.value)}
              placeholder="Descreva o escopo completo da implantação..."
              rows={6}
              className="resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Detalhe todas as atividades, módulos e entregas previstas para o projeto
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <User className="w-5 h-5 text-primary" />
              Usuários do Projeto
            </CardTitle>
            <CardDescription>
              Responsáveis pelo acompanhamento do projeto
            </CardDescription>
          </div>
          {!isReadOnly && (
            <Button onClick={handleAddUsuario} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Usuário
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {(!data.usuarios || data.usuarios.length === 0) ? (
            <div className="text-center p-8 border-2 border-dashed rounded-lg border-muted">
              <p className="text-muted-foreground">Nenhum usuário cadastrado.</p>
              {!isReadOnly && (
                <p className="text-sm text-muted-foreground mt-1">Clique no botão acima para adicionar responsáveis.</p>
              )}
            </div>
          ) : (
            data.usuarios.map((usuario, index) => (
              <div key={usuario.id} className="p-4 border rounded-lg bg-card/50 space-y-4 relative group">
                {!isReadOnly && (
                  <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                      onClick={() => handleRemoveUsuario(usuario.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <h4 className="font-medium text-sm flex items-center gap-2">
                  <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  Usuário Responsável
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`nome-${usuario.id}`}>Nome Completo</Label>
                    <Input
                      disabled={isReadOnly}
                      id={`nome-${usuario.id}`}
                      value={usuario.nome}
                      onChange={e => handleChangeUsuario(usuario.id, 'nome', e.target.value)}
                      placeholder="Nome do responsável"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`telefone-${usuario.id}`}>Telefone</Label>
                    <Input
                      disabled={isReadOnly}
                      id={`telefone-${usuario.id}`}
                      type="tel"
                      value={usuario.telefone}
                      onChange={e => handleChangeUsuario(usuario.id, 'telefone', e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`funcao-${usuario.id}`}>Função</Label>
                    <Input
                      disabled={isReadOnly}
                      id={`funcao-${usuario.id}`}
                      value={usuario.funcao}
                      onChange={e => handleChangeUsuario(usuario.id, 'funcao', e.target.value)}
                      placeholder="Ex: Gerente de Projetos"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

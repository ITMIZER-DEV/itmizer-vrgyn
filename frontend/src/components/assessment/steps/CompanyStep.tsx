import { CompanyData } from '@/types/assessment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, User, Users } from 'lucide-react';

interface CompanyStepProps {
  data: CompanyData;
  onChange: (data: CompanyData) => void;
  isReadOnly?: boolean;
}

export function CompanyStep({ data, onChange, isReadOnly }: CompanyStepProps) {
  const handleChange = (field: keyof CompanyData, value: string | number) => {
    if (isReadOnly) return;
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Building2 className="w-5 h-5 text-primary" />
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
            <Input
              disabled={isReadOnly}
              id="nomeFantasia"
              value={data.nomeFantasia}
              onChange={e => handleChange('nomeFantasia', e.target.value)}
              placeholder="Nome da empresa"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              disabled={isReadOnly}
              id="cnpj"
              value={data.cnpj}
              onChange={e => handleChange('cnpj', e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="endereco">Endereço (Matriz)</Label>
            <Input
              disabled={isReadOnly}
              id="endereco"
              value={data.endereco}
              onChange={e => handleChange('endereco', e.target.value)}
              placeholder="Endereço completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lojaNumero">Loja Número</Label>
            <Input
              disabled={isReadOnly}
              id="lojaNumero"
              type="number"
              min={1}
              value={data.lojaNumero}
              onChange={e => handleChange('lojaNumero', parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lojaTotalLojas">Total de Lojas</Label>
            <Input
              disabled={isReadOnly}
              id="lojaTotalLojas"
              type="number"
              min={1}
              value={data.lojaTotalLojas}
              onChange={e => handleChange('lojaTotalLojas', parseInt(e.target.value) || 1)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <User className="w-5 h-5 text-primary" />
            Contato Responsável
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contatoNome">Nome</Label>
            <Input
              disabled={isReadOnly}
              id="contatoNome"
              value={data.contatoNome}
              onChange={e => handleChange('contatoNome', e.target.value)}
              placeholder="Nome do responsável"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contatoFuncao">Função</Label>
            <Input
              disabled={isReadOnly}
              id="contatoFuncao"
              value={data.contatoFuncao}
              onChange={e => handleChange('contatoFuncao', e.target.value)}
              placeholder="Cargo/Função"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contatoEmail">E-mail</Label>
            <Input
              disabled={isReadOnly}
              id="contatoEmail"
              type="email"
              value={data.contatoEmail}
              onChange={e => handleChange('contatoEmail', e.target.value)}
              placeholder="email@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contatoCelular">Celular</Label>
            <Input
              disabled={isReadOnly}
              id="contatoCelular"
              value={data.contatoCelular}
              onChange={e => handleChange('contatoCelular', e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Users className="w-5 h-5 text-primary" />
            Equipe do Projeto
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="executivoVendas">Executivo de Vendas</Label>
            <Input
              disabled={isReadOnly}
              id="executivoVendas"
              value={data.executivoVendas}
              onChange={e => handleChange('executivoVendas', e.target.value)}
              placeholder="Nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consultorVR">Consultor VR</Label>
            <Input
              disabled={isReadOnly}
              id="consultorVR"
              value={data.consultorVR}
              onChange={e => handleChange('consultorVR', e.target.value)}
              placeholder="Nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsavelCliente">Responsável Cliente</Label>
            <Input
              disabled={isReadOnly}
              id="responsavelCliente"
              value={data.responsavelCliente}
              onChange={e => handleChange('responsavelCliente', e.target.value)}
              placeholder="Nome"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

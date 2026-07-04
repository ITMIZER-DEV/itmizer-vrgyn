import { MigracaoData } from '@/types/assessment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, KeyRound, Package, ShoppingCart, AlertTriangle, Scale, Users, Wallet, AlertCircle, Clock, CalendarDays } from 'lucide-react';

interface MigracaoStepProps {
  data: MigracaoData;
  onChange: (data: MigracaoData) => void;
  isReadOnly?: boolean;
}

export function MigracaoStep({ data, onChange, isReadOnly }: MigracaoStepProps) {
  const handleChange = (field: keyof MigracaoData, value: any) => {
    if (isReadOnly) return;
    onChange({ ...data, [field]: value });
  };

  const handleAcessosChange = (field: string, value: string) => {
    if (isReadOnly) return;
    onChange({
      ...data,
      acessos: {
        ...data.acessos,
        [field]: value,
      },
    });
  };

  const handleProdutoChange = (field: string, value: any) => {
    if (isReadOnly) return;
    onChange({
      ...data,
      produto: {
        ...data.produto,
        [field]: value,
      },
    });
  };

  const handleFiscalChange = (field: string, value: any) => {
    if (isReadOnly) return;
    onChange({
      ...data,
      fiscal: {
        ...data.fiscal,
        [field]: value,
      },
    });
  };

  const handleFornecedorClienteChange = (field: string, value: any) => {
    if (isReadOnly) return;
    onChange({
      ...data,
      fornecedorCliente: {
        ...data.fornecedorCliente,
        [field]: value,
      },
    });
  };

  const handleFinanceiroChange = (field: string, value: any) => {
    if (isReadOnly) return;
    onChange({
      ...data,
      financeiro: {
        ...data.financeiro,
        [field]: value,
      },
    });
  };


  const calculateTotalHours = () => {
    let total = 0;

    // Histórico de vendas
    total += data.vendasPeriodo || 1;

    // Produto
    if (data.produto?.cadastroProduto) total += 6;
    if (data.produto?.mercadologico) total += 2;
    if (data.produto?.familiaProdutos) total += 1;
    if (data.produto?.produtoFornecedor) total += 1;
    if (data.produto?.balanca) total += 1;

    // Fiscal
    if (data.fiscal?.mapaTributacao) total += 2;

    // Fornecedor Cliente
    if (data.fornecedorCliente?.cadastroFornecedor) total += 2;
    if (data.fornecedorCliente?.cadastroClientePreferencial) total += 2;
    if (data.fornecedorCliente?.cadastroConvenio) total += 4;

    // Financeiro
    if (data.financeiro?.cheque) total += 4;
    if (data.financeiro?.creditoRotativo) total += 4;
    if (data.financeiro?.contasPagar) total += 4;
    if (data.financeiro?.contasReceber) total += 4;
    if (data.financeiro?.outrasDespesas) total += 4;

    return total;
  };

  // Convert old values for display if they exist in state
  const displayTipo = data.tipo === 'padrao_bd' ? 'padrao' : data.tipo === 'planilhas' ? 'planilha' : data.tipo;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Resumo - Total Estimado de Horas */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Estimado de Horas</p>
                <p className="text-3xl font-bold text-primary">{calculateTotalHours()} horas</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Itens selecionados para migração</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tipo de Migração */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Database className="w-5 h-5 text-primary" />
            Tipo de Migração
          </CardTitle>
          <CardDescription>
            Selecione o tipo de migração que será realizada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="tipoMigracao">Tipo de Migração</Label>
            <Select
              disabled={isReadOnly}
              value={displayTipo}
              onValueChange={(value) => handleChange('tipo', value)}
            >
              <SelectTrigger disabled={isReadOnly} id="tipoMigracao">
                <SelectValue placeholder="Selecione o tipo de migração" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="padrao">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <span>Migração Padrão</span>
                  </div>
                </SelectItem>
                <SelectItem value="planilha">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Por Planilha</span>
                  </div>
                </SelectItem>
                <SelectItem value="consultoria">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Consultoria</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Datas de Virada */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <CalendarDays className="w-5 h-5 text-primary" />
            Datas de Virada
          </CardTitle>
          <CardDescription>
            Planejamento e execução da virada de sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataPrevistaVirada">Data Prevista de Virada</Label>
              <Input
                disabled={isReadOnly}
                id="dataPrevistaVirada"
                type="date"
                value={data.dataPrevistaVirada || ''}
                onChange={(e) => handleChange('dataPrevistaVirada', e.target.value || undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataViradaSistema">Data de Virada de Sistema</Label>
              <Input
                disabled={isReadOnly}
                id="dataViradaSistema"
                type="date"
                value={data.dataViradaSistema || ''}
                onChange={(e) => handleChange('dataViradaSistema', e.target.value || undefined)}
              />
              <p className="text-xs text-muted-foreground">Data efetiva da migração final</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acessos / Contato */}
      <Card className="glass-card border-orange-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display text-orange-600">
            <KeyRound className="w-5 h-5" />
            Acessos / Contato
          </CardTitle>
          <CardDescription>
            Informações para acesso remoto e contato com o cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nomeContatoChave">Nome do Contato Chave</Label>
              <Input
                disabled={isReadOnly}
                id="nomeContatoChave"
                value={data.acessos?.nomeContatoChave || ''}
                onChange={(e) => handleAcessosChange('nomeContatoChave', e.target.value)}
                placeholder="Nome do responsável técnico"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                disabled={isReadOnly}
                id="telefone"
                type="tel"
                value={data.acessos?.telefone || ''}
                onChange={(e) => handleAcessosChange('telefone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acessoAnydesk">Acesso AnyDesk</Label>
              <Input
                disabled={isReadOnly}
                id="acessoAnydesk"
                value={data.acessos?.acessoAnydesk || ''}
                onChange={(e) => handleAcessosChange('acessoAnydesk', e.target.value)}
                placeholder="ID AnyDesk"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senhaAnydesk">Senha AnyDesk</Label>
              <Input
                disabled={isReadOnly}
                id="senhaAnydesk"
                type="password"
                value={data.acessos?.senhaAnydesk || ''}
                onChange={(e) => handleAcessosChange('senhaAnydesk', e.target.value)}
                placeholder="********"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nomeSistema">Nome do Sistema</Label>
              <Input
                disabled={isReadOnly}
                id="nomeSistema"
                value={data.acessos?.nomeSistema || ''}
                onChange={(e) => handleAcessosChange('nomeSistema', e.target.value)}
                placeholder="Ex: Sistema XYZ"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeSoftwareHouse">Nome da Software House</Label>
              <Input
                disabled={isReadOnly}
                id="nomeSoftwareHouse"
                value={data.acessos?.nomeSoftwareHouse || ''}
                onChange={(e) => handleAcessosChange('nomeSoftwareHouse', e.target.value)}
                placeholder="Ex: Empresa ABC"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipoBancoDados">Tipo do Banco de Dados (Usuário, senha e banco)</Label>
            <Input
              id="tipoBancoDados"
              value={data.acessos?.tipoBancoDados || ''}
              onChange={(e) => handleAcessosChange('tipoBancoDados', e.target.value)}
              placeholder="Ex: MySQL - user: admin / senha: *** / db: sistema_producao"
            />
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Vendas */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display text-blue-600">
            <ShoppingCart className="w-5 h-5" />
            Histórico de Vendas
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Importado somente por base de dados. Não é possível realizar importação por planilhas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendasPeriodo">Histórico de Vendas (meses)</Label>
              <Input
                disabled={isReadOnly}
                id="vendasPeriodo"
                type="number"
                min="1"
                value={data.vendasPeriodo || 1}
                onChange={(e) => handleChange('vendasPeriodo', Number(e.target.value))}
                placeholder="Ex: 12"
              />
              <p className="text-xs text-muted-foreground">
                Cada mês adicionado aumenta +1 hora no tempo estimado
              </p>
            </div>

            <div className="flex items-center justify-center p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{data.vendasPeriodo || 1} hora{(data.vendasPeriodo || 1) > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produto */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display text-blue-600">
            <Package className="w-5 h-5" />
            Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'cadastroProduto', label: 'Cadastro de Produto', horas: 6 },
            { key: 'mercadologico', label: 'Mercadológico', horas: 2 },
            { key: 'familiaProdutos', label: 'Família de Produtos', horas: 1 },
            { key: 'produtoFornecedor', label: 'Produto Fornecedor', horas: 1 },
            { key: 'balanca', label: 'Balança (TXITENS, ITENSMGV)', horas: 1 },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition">
              <div className="flex items-center space-x-3">
                <Checkbox
                  disabled={isReadOnly}
                  id={item.key}
                  checked={!!data.produto?.[item.key as keyof typeof data.produto]}
                  onCheckedChange={(checked) => handleProdutoChange(item.key, !!checked)}
                />
                <label htmlFor={item.key} className="text-sm font-medium cursor-pointer flex-1">
                  {item.label}
                </label>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{item.horas} hora{item.horas > 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Fiscal e Tributário */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display text-amber-600">
            <Scale className="w-5 h-5" />
            Fiscal e Tributário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="mapaTributacao"
                checked={data.fiscal?.mapaTributacao || false}
                onCheckedChange={(checked) => handleFiscalChange('mapaTributacao', checked)}
              />
              <label htmlFor="mapaTributacao" className="text-sm font-medium cursor-pointer flex-1">
                Mapa de Tributação
              </label>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>2 horas</span>
            </div>
          </div>

          <div className="space-y-2 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <label htmlFor="revisaoFiscalObrigatoria" className="text-sm font-medium cursor-pointer flex-1">
                Revisão Fiscal Obrigatória
              </label>
              <Checkbox
                id="revisaoFiscalObrigatoria"
                checked={data.fiscal?.revisaoFiscalObrigatoria || false}
                onCheckedChange={(checked) => handleFiscalChange('revisaoFiscalObrigatoria', checked)}
              />
            </div>
            <Input
              placeholder="Qual empresa será responsável pela revisão fiscal?"
              value={data.fiscal?.empresaResponsavelRevisao || ''}
              onChange={(e) => handleFiscalChange('empresaResponsavelRevisao', e.target.value)}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Fornecedor, Cliente e Convênio */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display text-purple-600">
            <Users className="w-5 h-5" />
            Fornecedor, Cliente e Convênio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'cadastroFornecedor', label: 'Cadastro de Fornecedor', horas: 2 },
            { key: 'cadastroClientePreferencial', label: 'Cadastro de Cliente Preferencial', horas: 2 },
            { key: 'cadastroConvenio', label: 'Cadastro de Convênio (Empresa, Cliente, Transação)', horas: 4 },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition">
              <div className="flex items-center space-x-3">
                <Checkbox
                  disabled={isReadOnly}
                  id={item.key}
                  checked={!!data.fornecedorCliente?.[item.key as keyof typeof data.fornecedorCliente]}
                  onCheckedChange={(checked) => handleFornecedorClienteChange(item.key, !!checked)}
                />
                <label htmlFor={item.key} className="text-sm font-medium cursor-pointer flex-1">
                  {item.label}
                </label>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{item.horas} horas</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Financeiro */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display text-green-600">
            <Wallet className="w-5 h-5" />
            Financeiro
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Por padrão a migração só traz registro em aberto. Controle por planilha não será migrado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'cheque', label: 'Cheque', horas: 4 },
            { key: 'creditoRotativo', label: 'Crédito Rotativo (Fiado/Caderneta)', horas: 4 },
            { key: 'contasPagar', label: 'Contas a Pagar (Fornecedor)', horas: 4 },
            { key: 'contasReceber', label: 'Contas a Receber de Fornecedor (Devoluções, bonificações etc.)', horas: 4 },
            { key: 'outrasDespesas', label: 'Outras Despesas (Energia, Férias, Aluguel)', horas: 4 },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition">
              <div className="flex items-center space-x-3">
                <Checkbox
                  disabled={isReadOnly}
                  id={item.key}
                  checked={!!data.financeiro?.[item.key as keyof typeof data.financeiro]}
                  onCheckedChange={(checked) => handleFinanceiroChange(item.key, !!checked)}
                />
                <label htmlFor={item.key} className="text-sm font-medium cursor-pointer flex-1">
                  {item.label}
                </label>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{item.horas} horas</span>
              </div>
            </div>
          ))}

          <div className="space-y-2 pt-2">
            <Label htmlFor="observacaoFinanceiro">Observações</Label>
            <Textarea
              disabled={isReadOnly}
              id="observacaoFinanceiro"
              value={data.financeiro?.observacao || ''}
              onChange={(e) => handleFinanceiroChange('observacao', e.target.value)}
              placeholder="Observações adicionais sobre o financeiro..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dados Não Importados */}
      <Card className="glass-card border-red-500/30 bg-red-50/50 dark:bg-red-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display text-red-600">
            <AlertCircle className="w-5 h-5" />
            Dados Não Importados
          </CardTitle>
          <CardDescription className="text-red-700 dark:text-red-400">
            Os itens abaixo não serão importados em qualquer hipótese
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'pedidoCompras', label: 'Pedido de compras' },
              { key: 'notasEntradaSaida', label: 'Notas de entrada e saída' },
              { key: 'planoContas', label: 'Plano de contas' },
              { key: 'validadeProduto', label: 'Validade de Produto' },
              { key: 'historicoCompras', label: 'Histórico de compras' },
              { key: 'desmembramento', label: 'Desmembramento' },
              { key: 'extratoMovimentacao', label: 'Extrato de movimentação' },
            ].map((item) => (
              <div key={item.key} className="flex items-center space-x-3 p-2 rounded">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700 dark:text-red-400">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerta sobre Vendas */}
      <Alert className="border-yellow-500/50 bg-yellow-500/10">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200 font-medium">
          ⚠️ IMPORTANTE: "Vendas" refere-se ao HISTÓRICO DE VENDAS e não às notas fiscais de saída.
        </AlertDescription>
      </Alert>
    </div>
  );
}

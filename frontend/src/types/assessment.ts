export interface CompanyData {
  nomeFantasia: string;
  cnpj: string;
  endereco: string;
  contatoNome: string;
  contatoFuncao: string;
  contatoEmail: string;
  contatoCelular: string;
  executivoVendas: string;
  consultorVR: string;
  responsavelCliente: string;
  lojaNumero: number;
  lojaTotalLojas: number;
}

export interface NetworkData {
  links: {
    provedor: string;
    velocidade: string;
    dedicado: boolean;
    ipFixo: boolean;
  }[];
  firewall: boolean;
  proxy: boolean;
  antivirusPdv: boolean;
  pdvNoDominio: boolean;
  tipoConexaoPdv: string;
  ipFixoPdv: boolean;
}

export type ServerType = 'database' | 'application' | 'service_manager';

export interface ServerData {
  id: string;
  tipo: ServerType;
  processador: string;
  memoriaRam: string;
  discoTotal: string;
  discoLivre: string;
  sistemaOperacional: string;
  isVm: boolean;
  tempoUso: string;
  aplicacoesAtuais: string;
}

export interface PDVData {
  id: string;
  quantidade: number;
  sistemaOperacional: string;
  licenca: string;
  processador: string;
  memoriaRam: string;
  disco: string;
  tempoUso: string;
  usaNfce: boolean;
  satMarca: string;
  satModelo: string;
  satAtivo: boolean;
  impressora: string;
  teclado: string;
  balanca: string;
  scanner: string;
  pinpad: string;
  biometria: string;
  tipoPdv: string;
}

export interface PeripheralData {
  impressorasEtiqueta: string[];
  consultaPreco: string[];
  coletoresDados: string[];
  outros: string[];
}

export interface OperationalData {
  expediente: {
    dia: string;
    abertura: string;
    fechamento: string;
    pdvsAbertura: number;
    pdvsFechamento: number;
  }[];
  diasPico: string[];
  horariosPico: string[];
  operadoresPorTurno: number;
  usaFundoCaixa: boolean;
  usaSangria: boolean;
  formaLoginPdv: string;
}

export interface SystemsData {
  sistemaPdvAtual: string;
  bancoTipo: string;
  bancoHospedagem: string;
  acessoCredenciais: boolean;
  acessoBackup: boolean;
  integracaoCrm: boolean;
  integracaoEcommerce: boolean;
  integracaoMcommerce: boolean;
  customizacoesNecessarias: string;
  homologacoesNecessarias: string;
}

export interface BackofficeData {
  id: string;
  quantidade: number;
  funcao: string;
  processador: string;
  memoriaRam: string;
  disco: string;
  sistemaOperacional: string;
}

export interface ProjetoUsuario {
  id: string;
  nome: string;
  telefone: string;
  funcao: string;
}

export interface ProjetoData {
  quantidadeHoras: number;
  escopoImplantacao: string;
  usuarios: ProjetoUsuario[];
}

export interface MigracaoAcessos {
  nomeContatoChave: string;
  telefone: string;
  acessoAnydesk: string;
  senhaAnydesk: string;
  nomeSistema: string;
  nomeSoftwareHouse: string;
  tipoBancoDados: string;
}

export interface MigracaoProduto {
  cadastroProduto: boolean;
  horasCadastroProduto: number;
  mercadologico: boolean;
  horasMercadologico: number;
  familiaProdutos: boolean;
  horasFamiliaProdutos: number;
  produtoFornecedor: boolean;
  horasProdutoFornecedor: number;
  balanca: boolean;
  horasBalanca: number;
}

export interface MigracaoFiscal {
  mapaTributacao: boolean;
  horasMapaTributacao: number;
  revisaoFiscalObrigatoria: boolean;
  empresaResponsavelRevisao: string;
}

export interface MigracaoFornecedorCliente {
  cadastroFornecedor: boolean;
  horasCadastroFornecedor: number;
  cadastroClientePreferencial: boolean;
  horasCadastroClientePreferencial: number;
  cadastroConvenio: boolean;
  horasCadastroConvenio: number;
}

export interface MigracaoFinanceiro {
  cheque: boolean;
  horasCheque: number;
  creditoRotativo: boolean;
  horasCreditoRotativo: number;
  contasPagar: boolean;
  horasContasPagar: number;
  contasReceber: boolean;
  horasContasReceber: number;
  outrasDespesas: boolean;
  horasOutrasDespesas: number;
  observacao: string;
}

export interface MigracaoDadosNaoImportados {
  pedidoCompras: boolean;
  notasEntradaSaida: boolean;
  planoContas: boolean;
  validadeProduto: boolean;
  historicoCompras: boolean;
  desmembramento: boolean;
  extratoMovimentacao: boolean;
}

export interface MigracaoData {
  tipo: 'padrao_bd' | 'planilhas' | 'consultoria';
  acessos: MigracaoAcessos;
  produtoPeriodo: 1 | 2 | 3; // meses
  vendasPeriodo: 1 | 2 | 3; // meses
  dataPrevistaVirada?: string; // ISO date string
  dataViradaSistema?: string;  // ISO date string
  produto: MigracaoProduto;
  fiscal: MigracaoFiscal;
  fornecedorCliente: MigracaoFornecedorCliente;
  financeiro: MigracaoFinanceiro;
  dadosNaoImportados: MigracaoDadosNaoImportados;
}

export interface AssessmentData {
  id: string;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
  status: 'rascunho' | 'em_analise' | 'concluido' | 'Adequado' | 'Atenção' | 'Incompatível' | 'Rascunho';
  company: CompanyData;
  network: NetworkData;
  servers: ServerData[];
  backoffice: BackofficeData[];
  pdvs: PDVData[];
  peripherals: PeripheralData;
  operational: OperationalData;
  systems: SystemsData;
  projeto: ProjetoData;
  migracao: MigracaoData;
  history?: any[];
  porte: 'pequeno' | 'medio' | 'grande';
  multiLojas: boolean;
  validationResults: ValidationResult[];
}

export interface ValidationResult {
  field: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
}

export type AssessmentStep =
  | 'company'
  | 'network'
  | 'servers'
  | 'backoffice'
  | 'pdvs'
  | 'peripherals'
  | 'operational'
  | 'systems'
  | 'projeto'
  | 'migracao'
  | 'review'
  | 'validation';

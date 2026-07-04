import { AssessmentData } from '@/types/assessment';

const STORAGE_KEY = 'vr_assessments';

export function getAssessments(): AssessmentData[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function getAssessmentById(id: string): AssessmentData | null {
  const assessments = getAssessments();
  return assessments.find(a => a.id === id) || null;
}

export function saveAssessment(assessment: AssessmentData): void {
  const assessments = getAssessments();
  const index = assessments.findIndex(a => a.id === assessment.id);

  if (index >= 0) {
    assessments[index] = { ...assessment, updatedAt: new Date().toISOString() };
  } else {
    assessments.push(assessment);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(assessments));
}

export function deleteAssessment(id: string): void {
  const assessments = getAssessments().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assessments));
}

export function createNewAssessment(): AssessmentData {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'rascunho',
    company: {
      nomeFantasia: '',
      cnpj: '',
      endereco: '',
      contatoNome: '',
      contatoFuncao: '',
      contatoEmail: '',
      contatoCelular: '',
      executivoVendas: '',
      consultorVR: '',
      responsavelCliente: '',
      lojaNumero: 1,
      lojaTotalLojas: 1,
    },
    network: {
      links: [{ provedor: '', velocidade: '', dedicado: false, ipFixo: false }],
      firewall: false,
      proxy: false,
      antivirusPdv: false,
      pdvNoDominio: false,
      tipoConexaoPdv: '',
      ipFixoPdv: false,
    },
    servers: [],
    pdvs: [],
    backoffice: [],
    peripherals: {
      impressorasEtiqueta: [],
      consultaPreco: [],
      coletoresDados: [],
      outros: [],
    },
    operational: {
      expediente: [],
      diasPico: [],
      horariosPico: [],
      operadoresPorTurno: 0,
      usaFundoCaixa: false,
      usaSangria: false,
      formaLoginPdv: '',
    },
    systems: {
      sistemaPdvAtual: '',
      bancoTipo: '',
      bancoHospedagem: '',
      acessoCredenciais: false,
      acessoBackup: false,
      integracaoCrm: false,
      integracaoEcommerce: false,
      integracaoMcommerce: false,
      customizacoesNecessarias: '',
      homologacoesNecessarias: '',
    },
    porte: 'pequeno',
    multiLojas: false,
    validationResults: [],
  };
}

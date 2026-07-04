import { AssessmentData, ValidationResult, ServerData, PDVData } from '@/types/assessment';

const MIN_REQUIREMENTS = {
  server: {
    ramMin: 8, // GB
    discoLivreMin: 50, // GB
    processadorCores: 4,
  },
  pdv: {
    ramMin: 4, // GB
    discoMin: 120, // GB
  },
};

export function parseMemory(value: string): number {
  const num = parseFloat(value.replace(/[^\d.]/g, ''));
  if (value.toLowerCase().includes('tb')) return num * 1024;
  return num;
}

export function validateServer(server: ServerData): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  const ram = parseMemory(server.memoriaRam);
  if (ram < MIN_REQUIREMENTS.server.ramMin) {
    results.push({
      field: `server-${server.id}-ram`,
      status: 'error',
      message: `RAM insuficiente: ${server.memoriaRam}. Mínimo: ${MIN_REQUIREMENTS.server.ramMin}GB`,
    });
  } else {
    results.push({
      field: `server-${server.id}-ram`,
      status: 'ok',
      message: `RAM adequada: ${server.memoriaRam}`,
    });
  }

  const discoLivre = parseMemory(server.discoLivre);
  if (discoLivre < MIN_REQUIREMENTS.server.discoLivreMin) {
    results.push({
      field: `server-${server.id}-disco`,
      status: 'warning',
      message: `Espaço em disco baixo: ${server.discoLivre}. Recomendado: >${MIN_REQUIREMENTS.server.discoLivreMin}GB`,
    });
  } else {
    results.push({
      field: `server-${server.id}-disco`,
      status: 'ok',
      message: `Espaço em disco adequado: ${server.discoLivre}`,
    });
  }

  return results;
}

export function validatePDV(pdv: PDVData): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  const ram = parseMemory(pdv.memoriaRam);
  if (ram < MIN_REQUIREMENTS.pdv.ramMin) {
    results.push({
      field: `pdv-${pdv.id}-ram`,
      status: 'error',
      message: `RAM insuficiente: ${pdv.memoriaRam}. Mínimo: ${MIN_REQUIREMENTS.pdv.ramMin}GB`,
    });
  } else {
    results.push({
      field: `pdv-${pdv.id}-ram`,
      status: 'ok',
      message: `RAM adequada: ${pdv.memoriaRam}`,
    });
  }

  return results;
}

export function getTotalPDVCount(pdvs: PDVData[]): number {
  return pdvs.reduce((total, pdv) => total + (pdv.quantidade || 1), 0);
}

export function getTotalBackofficeCount(backoffice: any[]): number {
  return backoffice.reduce((total, item) => total + (item.quantidade || 1), 0);
}

export function calculatePorte(data: AssessmentData): 'pequeno' | 'medio' | 'grande' {
  const numPdvs = getTotalPDVCount(data.pdvs);
  const numLojas = data.company.lojaTotalLojas;
  const numServers = data.servers.length;
  const hasIntegrations = data.systems.integracaoCrm || data.systems.integracaoEcommerce || data.systems.integracaoMcommerce;

  let score = 0;

  // PDVs (agora considera a quantidade total)
  if (numPdvs > 10) score += 3;
  else if (numPdvs >= 4) score += 2;
  else score += 1;

  // Lojas
  if (numLojas > 5) score += 3;
  else if (numLojas >= 2) score += 2;
  else score += 1;

  // Servidores
  if (numServers > 2) score += 3;
  else if (numServers >= 2) score += 2;
  else score += 1;

  // Integrações
  if (hasIntegrations) score += 1;

  if (score >= 9) return 'grande';
  if (score >= 5) return 'medio';
  return 'pequeno';
}

export function validateAssessment(data: AssessmentData): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Validate servers
  data.servers.forEach(server => {
    results.push(...validateServer(server));
  });

  // Validate PDVs
  data.pdvs.forEach(pdv => {
    results.push(...validatePDV(pdv));
  });

  // Network validation
  if (!data.network.firewall) {
    results.push({
      field: 'network-firewall',
      status: 'warning',
      message: 'Firewall não configurado. Recomendado para segurança.',
    });
  }

  if (!data.network.antivirusPdv) {
    results.push({
      field: 'network-antivirus',
      status: 'warning',
      message: 'Antivírus não instalado nos PDVs. Recomendado para segurança.',
    });
  }

  return results;
}

export function getOverallStatus(results: ValidationResult[]): 'ok' | 'warning' | 'error' {
  if (results.some(r => r.status === 'error')) return 'error';
  if (results.some(r => r.status === 'warning')) return 'warning';
  return 'ok';
}

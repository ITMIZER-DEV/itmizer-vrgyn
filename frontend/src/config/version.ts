export interface ReleaseHistoryItem {
  version: string;
  build: number;
  date: string;
  type: 'major' | 'minor' | 'patch' | string;
  description: string;
}

export interface SystemVersion {
  version: string;
  build: number;
  releaseDate: string;
  systemName: string;
  history?: ReleaseHistoryItem[];
}

export const APP_VERSION = '1.0.1';
export const APP_BUILD = 2;
export const RELEASE_DATE = '2026-10-01T12:12:09.898Z';
export const SYSTEM_NAME = 'ITMIZER VR (VRGYN)';

export const RELEASE_HISTORY: ReleaseHistoryItem[] = [
  {
    "version": "1.0.1",
    "build": 2,
    "date": "2026-10-01",
    "type": "patch",
    "description": "Revisão das Skills de IA e modal interativo de histórico de releases no frontend"
  },
  {
    "version": "1.0.0",
    "build": 1,
    "date": "2026-09-30",
    "type": "major",
    "description": "Release inicial: Módulo de Suporte, Dados de Acesso (Vault), Casos Críticos, Timeline de Evoluções e Relatórios em PDF"
  }
];

export const VERSION_INFO: SystemVersion = {
  version: APP_VERSION,
  build: APP_BUILD,
  releaseDate: RELEASE_DATE,
  systemName: SYSTEM_NAME,
  history: RELEASE_HISTORY,
};

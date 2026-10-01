export interface SystemVersion {
  version: string;
  build: number;
  releaseDate: string;
  systemName: string;
}

export const APP_VERSION = '1.0.0';
export const APP_BUILD = 1;
export const RELEASE_DATE = '2026-09-30T22:15:00.000Z';
export const SYSTEM_NAME = 'ITMIZER VR (VRGYN)';

export const VERSION_INFO: SystemVersion = {
  version: APP_VERSION,
  build: APP_BUILD,
  releaseDate: RELEASE_DATE,
  systemName: SYSTEM_NAME,
};

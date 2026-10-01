import { Injectable } from '@nestjs/common';

export interface AppVersionResponse {
  version: string;
  build: number;
  releaseDate: string;
  systemName: string;
  environment: string;
  uptime: number;
}

export const APP_VERSION = '1.0.1';
export const APP_BUILD = 2;
export const RELEASE_DATE = '2026-10-01T12:12:09.898Z';
export const SYSTEM_NAME = 'ITMIZER VR (VRGYN)';

@Injectable()
export class AppService {
  private readonly startTime = Date.now();

  getHello(): string {
    return 'ITMIZER VR API Online';
  }

  getVersion(): AppVersionResponse {
    return {
      version: APP_VERSION,
      build: APP_BUILD,
      releaseDate: RELEASE_DATE,
      systemName: SYSTEM_NAME,
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}


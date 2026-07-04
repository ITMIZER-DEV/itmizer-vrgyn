import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as request from 'supertest';
import { ClientCredentialsController } from './client-credentials.controller';
import { ClientCredentialsService } from './client-credentials.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('ClientCredentialsController (reveal/copy role gate)', () => {
  let app: INestApplication;
  let currentRoles: string[];

  const serviceMock = {
    reveal: jest.fn().mockResolvedValue({ secret: 'plaintext-secreto' }),
    copy: jest.fn().mockResolvedValue({ secret: 'plaintext-secreto' }),
    updateSecret: jest.fn().mockResolvedValue({ id: 'cred-1', label: 'Anydesk' }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  async function buildApp() {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ClientCredentialsController],
      providers: [{ provide: ClientCredentialsService, useValue: serviceMock }, RolesGuard, Reflector],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: 'user-1', roles: currentRoles };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  }

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('allows reveal for admin', async () => {
    currentRoles = ['admin'];
    await buildApp();
    await request(app.getHttpServer()).get('/client-credentials/cred-1/reveal').expect(200);
    expect(serviceMock.reveal).toHaveBeenCalledWith('cred-1', 'user-1');
  });

  it('allows reveal for supervisao', async () => {
    currentRoles = ['supervisao'];
    await buildApp();
    await request(app.getHttpServer()).get('/client-credentials/cred-1/reveal').expect(200);
  });

  it('blocks reveal for support (403)', async () => {
    currentRoles = ['support'];
    await buildApp();
    await request(app.getHttpServer()).get('/client-credentials/cred-1/reveal').expect(403);
    expect(serviceMock.reveal).not.toHaveBeenCalled();
  });

  it('blocks reveal for a role with no roles at all (403)', async () => {
    currentRoles = [];
    await buildApp();
    await request(app.getHttpServer()).get('/client-credentials/cred-1/reveal').expect(403);
  });

  it('allows copy for support (non-supervisor roles can still copy)', async () => {
    currentRoles = ['support'];
    await buildApp();
    await request(app.getHttpServer()).post('/client-credentials/cred-1/copy').expect(201);
    expect(serviceMock.copy).toHaveBeenCalledWith('cred-1', 'user-1');
  });

  it('blocks updateSecret for support (403)', async () => {
    currentRoles = ['support'];
    await buildApp();
    await request(app.getHttpServer())
      .patch('/client-credentials/cred-1/secret')
      .send({ secret: 'nova-senha' })
      .expect(403);
    expect(serviceMock.updateSecret).not.toHaveBeenCalled();
  });

  it('allows updateSecret for admin', async () => {
    currentRoles = ['admin'];
    await buildApp();
    await request(app.getHttpServer())
      .patch('/client-credentials/cred-1/secret')
      .send({ secret: 'nova-senha' })
      .expect(200);
    expect(serviceMock.updateSecret).toHaveBeenCalled();
  });

  it('blocks remove for support (403)', async () => {
    currentRoles = ['support'];
    await buildApp();
    await request(app.getHttpServer()).delete('/client-credentials/cred-1').expect(403);
    expect(serviceMock.remove).not.toHaveBeenCalled();
  });

  it('allows remove for admin', async () => {
    currentRoles = ['admin'];
    await buildApp();
    await request(app.getHttpServer()).delete('/client-credentials/cred-1').expect(200);
    expect(serviceMock.remove).toHaveBeenCalled();
  });
});

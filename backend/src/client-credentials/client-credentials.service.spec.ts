import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClientCredentialAction } from '@prisma/client';
import { ClientCredentialsService } from './client-credentials.service';
import { CredentialCryptoService } from './credential-crypto.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClientCredentialsService', () => {
  let service: ClientCredentialsService;

  const prismaMock = {
    clientCredential: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    clientCredentialAccessLog: {
      create: jest.fn(),
    },
  };

  const cryptoMock = {
    encrypt: jest.fn().mockReturnValue({ ciphertext: 'enc', iv: 'iv', authTag: 'tag' }),
    decrypt: jest.fn().mockReturnValue('plaintext-secreto'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ClientCredentialsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CredentialCryptoService, useValue: cryptoMock },
      ],
    }).compile();
    service = moduleRef.get<ClientCredentialsService>(ClientCredentialsService);
  });

  it('encrypts the secret on create and never persists it in plaintext', async () => {
    prismaMock.clientCredential.create.mockResolvedValue({ id: '1', label: 'Anydesk' });
    await service.create(
      { clientId: 'c1', type: 'ACESSO_REMOTO' as any, label: 'Anydesk', secret: 'senha-123' },
      'user-1',
    );
    expect(cryptoMock.encrypt).toHaveBeenCalledWith('senha-123');
    const createArgs = prismaMock.clientCredential.create.mock.calls[0][0];
    expect(createArgs.data.secretCiphertext).toBe('enc');
    expect(createArgs.data).not.toHaveProperty('secret');
    expect(createArgs.data.createdById).toBe('user-1');
  });

  it('reveal() decrypts the secret and logs a VIEW access', async () => {
    prismaMock.clientCredential.findUnique.mockResolvedValue({
      id: 'cred-1',
      secretCiphertext: 'enc',
      secretIv: 'iv',
      secretAuthTag: 'tag',
    });
    const result = await service.reveal('cred-1', 'user-1');
    expect(result).toEqual({ secret: 'plaintext-secreto' });
    expect(prismaMock.clientCredentialAccessLog.create).toHaveBeenCalledWith({
      data: { credentialId: 'cred-1', userId: 'user-1', action: ClientCredentialAction.VIEW },
    });
  });

  it('copy() decrypts the secret and logs a COPY access', async () => {
    prismaMock.clientCredential.findUnique.mockResolvedValue({
      id: 'cred-1',
      secretCiphertext: 'enc',
      secretIv: 'iv',
      secretAuthTag: 'tag',
    });
    const result = await service.copy('cred-1', 'user-1');
    expect(result).toEqual({ secret: 'plaintext-secreto' });
    expect(prismaMock.clientCredentialAccessLog.create).toHaveBeenCalledWith({
      data: { credentialId: 'cred-1', userId: 'user-1', action: ClientCredentialAction.COPY },
    });
  });

  it('throws NotFoundException when revealing a credential that does not exist', async () => {
    prismaMock.clientCredential.findUnique.mockResolvedValue(null);
    await expect(service.reveal('missing', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('findByClient never selects the ciphertext fields', async () => {
    prismaMock.clientCredential.findMany.mockResolvedValue([]);
    await service.findByClient('c1');
    const callArgs = prismaMock.clientCredential.findMany.mock.calls[0][0];
    expect(callArgs.select).not.toHaveProperty('secretCiphertext');
    expect(callArgs.select).not.toHaveProperty('secretIv');
    expect(callArgs.select).not.toHaveProperty('secretAuthTag');
  });
});

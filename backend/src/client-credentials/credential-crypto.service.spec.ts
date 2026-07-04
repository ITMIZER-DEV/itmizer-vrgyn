import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CredentialCryptoService } from './credential-crypto.service';

describe('CredentialCryptoService', () => {
  const TEST_KEY = Buffer.alloc(32, 7).toString('base64');

  async function buildService(keyValue: string | undefined) {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialCryptoService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(keyValue) } },
      ],
    }).compile();
    await moduleRef.init();
    return moduleRef.get<CredentialCryptoService>(CredentialCryptoService);
  }

  it('encrypts and decrypts back to the original plaintext', async () => {
    const service = await buildService(TEST_KEY);
    const payload = service.encrypt('senha-super-secreta-123');
    expect(payload.ciphertext).not.toContain('senha-super-secreta-123');
    expect(service.decrypt(payload)).toBe('senha-super-secreta-123');
  });

  it('produces a different ciphertext and iv on every call (no iv reuse)', async () => {
    const service = await buildService(TEST_KEY);
    const first = service.encrypt('mesma-senha');
    const second = service.encrypt('mesma-senha');
    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it('throws when the ciphertext was tampered with', async () => {
    const service = await buildService(TEST_KEY);
    const payload = service.encrypt('outra-senha');
    const tampered = { ...payload, ciphertext: Buffer.from('conteudo-forjado').toString('base64') };
    expect(() => service.decrypt(tampered)).toThrow();
  });

  it('fails fast on module init when CREDENTIAL_ENCRYPTION_KEY is missing', async () => {
    await expect(buildService(undefined)).rejects.toThrow('CREDENTIAL_ENCRYPTION_KEY');
  });

  it('fails fast on module init when the key is not 32 bytes', async () => {
    const shortKey = Buffer.alloc(16, 1).toString('base64');
    await expect(buildService(shortKey)).rejects.toThrow('32 bytes');
  });
});

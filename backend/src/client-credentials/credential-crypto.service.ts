import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

@Injectable()
export class CredentialCryptoService implements OnModuleInit {
  private key: Buffer;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const rawKey = this.configService.get<string>('CREDENTIAL_ENCRYPTION_KEY');
    if (!rawKey) {
      throw new Error(
        'CREDENTIAL_ENCRYPTION_KEY não configurada. Gere uma chave de 32 bytes em base64 (ex: `openssl rand -base64 32`) e defina no .env.',
      );
    }
    const key = Buffer.from(rawKey, 'base64');
    if (key.length !== 32) {
      throw new Error(
        `CREDENTIAL_ENCRYPTION_KEY inválida: esperado 32 bytes em base64, recebido ${key.length} bytes.`,
      );
    }
    this.key = key;
  }

  encrypt(plaintext: string): EncryptedPayload {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  decrypt(payload: EncryptedPayload): string {
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(payload.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, 'base64')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }
}

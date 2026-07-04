import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientCredentialAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CredentialCryptoService } from './credential-crypto.service';
import { CreateClientCredentialDto } from './dto/create-client-credential.dto';
import { UpdateClientCredentialMetadataDto } from './dto/update-client-credential-metadata.dto';
import { UpdateClientCredentialSecretDto } from './dto/update-client-credential-secret.dto';

const METADATA_SELECT = {
  id: true,
  clientId: true,
  type: true,
  label: true,
  username: true,
  responsavelNome: true,
  responsavelTelefone: true,
  responsavelEmail: true,
  notes: true,
  isActive: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class ClientCredentialsService {
  constructor(
    private prisma: PrismaService,
    private crypto: CredentialCryptoService,
  ) {}

  create(dto: CreateClientCredentialDto, userId?: string) {
    const { secret, ...metadata } = dto;
    const { ciphertext, iv, authTag } = this.crypto.encrypt(secret);
    return this.prisma.clientCredential.create({
      data: {
        ...metadata,
        secretCiphertext: ciphertext,
        secretIv: iv,
        secretAuthTag: authTag,
        createdById: userId,
      },
      select: METADATA_SELECT,
    });
  }

  findByClient(clientId: string) {
    return this.prisma.clientCredential.findMany({
      where: { clientId },
      select: METADATA_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  private async findRaw(id: string) {
    const credential = await this.prisma.clientCredential.findUnique({ where: { id } });
    if (!credential) throw new NotFoundException('Credencial não encontrada');
    return credential;
  }

  async updateMetadata(id: string, dto: UpdateClientCredentialMetadataDto) {
    await this.findRaw(id);
    return this.prisma.clientCredential.update({ where: { id }, data: dto, select: METADATA_SELECT });
  }

  async updateSecret(id: string, dto: UpdateClientCredentialSecretDto) {
    await this.findRaw(id);
    const { ciphertext, iv, authTag } = this.crypto.encrypt(dto.secret);
    return this.prisma.clientCredential.update({
      where: { id },
      data: { secretCiphertext: ciphertext, secretIv: iv, secretAuthTag: authTag },
      select: METADATA_SELECT,
    });
  }

  async remove(id: string) {
    await this.findRaw(id);
    return this.prisma.clientCredential.delete({ where: { id } });
  }

  async reveal(id: string, userId?: string) {
    const credential = await this.findRaw(id);
    const plaintext = this.crypto.decrypt({
      ciphertext: credential.secretCiphertext,
      iv: credential.secretIv,
      authTag: credential.secretAuthTag,
    });
    await this.prisma.clientCredentialAccessLog.create({
      data: { credentialId: id, userId, action: ClientCredentialAction.VIEW },
    });
    return { secret: plaintext };
  }

  async copy(id: string, userId?: string) {
    const credential = await this.findRaw(id);
    const plaintext = this.crypto.decrypt({
      ciphertext: credential.secretCiphertext,
      iv: credential.secretIv,
      authTag: credential.secretAuthTag,
    });
    await this.prisma.clientCredentialAccessLog.create({
      data: { credentialId: id, userId, action: ClientCredentialAction.COPY },
    });
    return { secret: plaintext };
  }
}

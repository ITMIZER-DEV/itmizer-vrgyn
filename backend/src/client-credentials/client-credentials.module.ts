import { Module } from '@nestjs/common';
import { ClientCredentialsService } from './client-credentials.service';
import { ClientCredentialsController } from './client-credentials.controller';
import { CredentialCryptoService } from './credential-crypto.service';

@Module({
  controllers: [ClientCredentialsController],
  providers: [ClientCredentialsService, CredentialCryptoService],
})
export class ClientCredentialsModule {}

import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateClientCredentialDto } from './create-client-credential.dto';

export class UpdateClientCredentialMetadataDto extends PartialType(
  OmitType(CreateClientCredentialDto, ['secret', 'clientId'] as const),
) {}

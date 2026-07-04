import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateClientInfrastructureDto } from './create-client-infrastructure.dto';

export class UpdateClientInfrastructureDto extends PartialType(
  OmitType(CreateClientInfrastructureDto, ['clientId'] as const),
) {}

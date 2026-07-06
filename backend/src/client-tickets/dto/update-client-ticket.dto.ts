import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateClientTicketDto } from './create-client-ticket.dto';

export class UpdateClientTicketDto extends PartialType(
  OmitType(CreateClientTicketDto, ['clientId'] as const),
) {}

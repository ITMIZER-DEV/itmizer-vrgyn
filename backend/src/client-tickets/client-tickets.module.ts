import { Module } from '@nestjs/common';
import { ClientTicketsService } from './client-tickets.service';
import { ClientTicketsController } from './client-tickets.controller';

@Module({
  controllers: [ClientTicketsController],
  providers: [ClientTicketsService],
})
export class ClientTicketsModule {}

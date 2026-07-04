import { Module } from '@nestjs/common';
import { ClientInfrastructureService } from './client-infrastructure.service';
import { ClientInfrastructureController } from './client-infrastructure.controller';

@Module({
  controllers: [ClientInfrastructureController],
  providers: [ClientInfrastructureService],
})
export class ClientInfrastructureModule {}

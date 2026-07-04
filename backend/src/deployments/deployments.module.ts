import { Module } from '@nestjs/common';
import { DeploymentsService } from './deployments.service';
import { DeploymentsController } from './deployments.controller';

@Module({
  controllers: [DeploymentsController],
  providers: [DeploymentsService],
})
export class DeploymentsModule {}

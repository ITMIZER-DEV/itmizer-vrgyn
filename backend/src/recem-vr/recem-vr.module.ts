import { Module } from '@nestjs/common';
import { RecemVrService } from './recem-vr.service';
import { RecemVrController } from './recem-vr.controller';

@Module({
  controllers: [RecemVrController],
  providers: [RecemVrService],
})
export class RecemVrModule {}

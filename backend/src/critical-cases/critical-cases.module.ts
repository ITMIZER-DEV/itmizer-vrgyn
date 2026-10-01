import { Module } from '@nestjs/common';
import { CriticalCasesService } from './critical-cases.service';
import { CriticalCasesController } from './critical-cases.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CriticalCasesController],
  providers: [CriticalCasesService],
  exports: [CriticalCasesService],
})
export class CriticalCasesModule {}

import { Module } from '@nestjs/common';
import { MigrationController } from './migration.controller';
import { MigrationService } from './migration.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [MigrationController],
    providers: [MigrationService],
})
export class MigrationModule { }

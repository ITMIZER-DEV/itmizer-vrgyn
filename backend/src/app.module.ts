import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { ConfigModule as AppConfigModule } from './config/config.module'; // Renamed to avoid conflict
import { ConfigModule } from '@nestjs/config'; // Import global ConfigModule
import { ClientsModule } from './clients/clients.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { MigrationModule } from './migration/migration.module';
import { MenusModule } from './menus/menus.module';
import { DeploymentsModule } from './deployments/deployments.module';
import { RecemVrModule } from './recem-vr/recem-vr.module';
import { ClientInfrastructureModule } from './client-infrastructure/client-infrastructure.module';
import { ClientCredentialsModule } from './client-credentials/client-credentials.module';
import { ClientTicketsModule } from './client-tickets/client-tickets.module';
import { CriticalCasesModule } from './critical-cases/critical-cases.module';

import { ScheduleModule } from '@nestjs/schedule';
import { BackupModule } from './backup/backup.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    AssessmentsModule,
    AppConfigModule,
    ClientsModule,
    InfrastructureModule,
    MigrationModule,
    MenusModule,
    DeploymentsModule,
    RecemVrModule,
    ClientInfrastructureModule,
    ClientCredentialsModule,
    ClientTicketsModule,
    CriticalCasesModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

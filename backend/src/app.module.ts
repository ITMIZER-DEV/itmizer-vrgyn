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

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, UsersModule, AssessmentsModule, AppConfigModule, ClientsModule, InfrastructureModule, MigrationModule, MenusModule, DeploymentsModule, RecemVrModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

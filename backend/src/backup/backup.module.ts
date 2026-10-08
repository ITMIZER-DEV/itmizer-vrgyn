import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { GoogleDriveService } from './google-drive.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [BackupController],
    providers: [BackupService, GoogleDriveService],
    exports: [BackupService, GoogleDriveService],
})
export class BackupModule {}

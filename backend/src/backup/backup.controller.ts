import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Res,
    UseGuards,
    HttpStatus,
    HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { BackupService, BackupConfigDto } from './backup.service';
import { GoogleDriveService } from './google-drive.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as fs from 'fs';
import * as path from 'path';

@Controller('backups')
@UseGuards(JwtAuthGuard)
export class BackupController {
    constructor(
        private readonly backupService: BackupService,
        private readonly googleDriveService: GoogleDriveService,
    ) {}

    @Get('config')
    async getConfig() {
        return await this.backupService.getConfig();
    }

    @Put('config')
    async updateConfig(@Body() dto: BackupConfigDto) {
        return await this.backupService.updateConfig(dto);
    }

    @Post('test-drive')
    async testDrive(
        @Body('folderId') folderId?: string,
        @Body('googleServiceAccountJson') googleServiceAccountJson?: string,
    ) {
        const config = await this.backupService.getConfig();
        const targetFolder = folderId || config.googleDriveFolderId;
        const driveCreds = {
            googleServiceAccountJson: googleServiceAccountJson || config.googleServiceAccountJson,
            googleServiceAccountEmail: config.googleServiceAccountEmail,
            googlePrivateKey: config.googlePrivateKey,
        };
        return await this.googleDriveService.testConnection(targetFolder, driveCreds);
    }

    @Get('logs')
    async getLogs() {
        return await this.backupService.getLogs(50);
    }

    @Post('generate')
    async generateBackup() {
        return await this.backupService.generateBackup('MANUAL');
    }

    @Post(':id/restore')
    async restoreBackup(@Param('id') id: string) {
        try {
            return await this.backupService.restoreBackup(id);
        } catch (error: any) {
            throw new HttpException(
                { message: `Erro ao restaurar backup: ${error.message}` },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Get(':id/download')
    async downloadBackup(@Param('id') id: string, @Res() res: Response) {
        try {
            const filePath = await this.backupService.getBackupFilePath(id);
            if (!fs.existsSync(filePath)) {
                throw new HttpException('Arquivo não encontrado no disco.', HttpStatus.NOT_FOUND);
            }
            const fileName = path.basename(filePath);
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', 'application/json');
            return res.sendFile(path.resolve(filePath));
        } catch (error: any) {
            throw new HttpException(
                { message: `Falha no download: ${error.message}` },
                HttpStatus.NOT_FOUND,
            );
        }
    }
}

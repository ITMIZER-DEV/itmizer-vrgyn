import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleDriveService } from './google-drive.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

export interface BackupConfigDto {
    scheduleEnabled?: boolean;
    scheduleTime?: string;
    frequency?: string;
    googleDriveEnabled?: boolean;
    googleDriveFolderId?: string;
    googleDriveFolderUrl?: string;
    retentionDays?: number;
    backupFormat?: string;
}

@Injectable()
export class BackupService implements OnModuleInit {
    private readonly logger = new Logger(BackupService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly googleDriveService: GoogleDriveService,
    ) {}

    async onModuleInit() {
        try {
            await this.ensureConfigExists();
        } catch (err: any) {
            this.logger.warn(`Aviso ao inicializar configurações de backup: ${err.message}`);
        }
    }

    private getBackupDir(): string {
        const possibleDirs = [
            path.resolve(process.cwd(), 'backups'),
            path.resolve(__dirname, '../../backups'),
            path.resolve(__dirname, '../../../backups'),
            '/app/backups',
        ];
        const existing = possibleDirs.find((d) => fs.existsSync(d));
        if (existing) return existing;

        const defaultDir = possibleDirs[0];
        if (!fs.existsSync(defaultDir)) {
            fs.mkdirSync(defaultDir, { recursive: true });
        }
        return defaultDir;
    }

    async ensureConfigExists() {
        const config = await this.prisma.systemBackupConfig.findUnique({
            where: { id: 'default' },
        });

        if (!config) {
            return await this.prisma.systemBackupConfig.create({
                data: {
                    id: 'default',
                    scheduleEnabled: true,
                    scheduleTime: '00:00',
                    frequency: 'DAILY',
                    googleDriveEnabled: true,
                    googleDriveFolderId: '0AAzNdB7t26iUUk9PVA',
                    googleDriveFolderUrl: 'https://drive.google.com/drive/folders/0AAzNdB7t26iUUk9PVA',
                    retentionDays: 15,
                    backupFormat: 'HYBRID',
                },
            });
        }
        return config;
    }

    async getConfig() {
        return await this.ensureConfigExists();
    }

    async updateConfig(dto: BackupConfigDto) {
        await this.ensureConfigExists();
        return await this.prisma.systemBackupConfig.update({
            where: { id: 'default' },
            data: {
                ...dto,
            },
        });
    }

    async getLogs(limit: number = 30) {
        const logs = await this.prisma.systemBackupLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return logs.map((log) => ({
            ...log,
            fileSize: Number(log.fileSize),
        }));
    }

    /**
     * Cron executado a cada hora para checar se deve disparar o backup automático
     */
    @Cron('0 * * * *')
    async handleScheduledCron() {
        try {
            const config = await this.getConfig();
            if (!config.scheduleEnabled) {
                return;
            }

            const now = new Date();
            const currentHourStr = `${String(now.getHours()).padStart(2, '0')}:00`;
            const configuredTime = config.scheduleTime || '00:00';

            // Compara a hora cheia configurada (ex: "00:00") com a hora atual
            const configuredHourOnly = configuredTime.split(':')[0] + ':00';

            if (currentHourStr === configuredHourOnly) {
                this.logger.log(`⏰ Disparando backup agendado diário (${configuredTime})...`);
                await this.generateBackup('AUTOMATIC');
            }
        } catch (error: any) {
            this.logger.error(`Erro no agendador de backup: ${error.message}`);
        }
    }

    /**
     * Executa a extração completa dos dados de todas as 27 tabelas
     */
    async generateBackup(type: 'AUTOMATIC' | 'MANUAL' = 'MANUAL') {
        const startTime = Date.now();
        this.logger.log(`Iniciando geração de backup (${type})...`);

        const backupData: Record<string, any[]> = {};
        const report: Record<string, number> = {};
        let totalRecords = 0;

        const extractors: { name: string; fetch: () => Promise<any[]> }[] = [
            { name: 'users', fetch: () => this.prisma.user.findMany() },
            { name: 'profiles', fetch: () => this.prisma.profile.findMany() },
            { name: 'user_roles', fetch: () => this.prisma.userRole.findMany() },
            { name: 'clients', fetch: () => this.prisma.client.findMany() },
            { name: 'infrastructure_requirements', fetch: () => this.prisma.infrastructureRequirement.findMany() },
            { name: 'server_requirements', fetch: () => this.prisma.serverRequirement.findMany() },
            { name: 'terminal_requirements', fetch: () => this.prisma.terminalRequirement.findMany() },
            { name: 'internet_requirements', fetch: () => this.prisma.internetRequirement.findMany() },
            { name: 'homologated_peripherals', fetch: () => this.prisma.homologatedPeripheral.findMany() },
            { name: 'menus', fetch: () => this.prisma.menu.findMany() },
            { name: 'submenus', fetch: () => this.prisma.submenu.findMany() },
            { name: 'assessments', fetch: () => this.prisma.assessment.findMany() },
            { name: 'assessment_history', fetch: () => this.prisma.assessmentHistory.findMany() },
            { name: 'deployments', fetch: () => this.prisma.deployment.findMany() },
            { name: 'deployment_history', fetch: () => this.prisma.deploymentHistory.findMany() },
            { name: 'migrations', fetch: () => this.prisma.migration.findMany() },
            { name: 'migration_history', fetch: () => this.prisma.migrationHistory.findMany() },
            { name: 'migration_lancamentos', fetch: () => this.prisma.migrationLancamento.findMany() },
            { name: 'recem_vr', fetch: () => this.prisma.recemVr.findMany() },
            { name: 'recem_vr_acompanhamentos', fetch: () => this.prisma.recemVrAcompanhamento.findMany() },
            { name: 'recem_vr_history', fetch: () => this.prisma.recemVrHistory.findMany() },
            { name: 'client_infrastructure', fetch: () => this.prisma.clientInfrastructure.findMany() },
            { name: 'client_credentials', fetch: () => this.prisma.clientCredential.findMany() },
            { name: 'client_credential_access_logs', fetch: () => this.prisma.clientCredentialAccessLog.findMany() },
            { name: 'client_tickets', fetch: () => this.prisma.clientTicket.findMany() },
            { name: 'critical_cases', fetch: () => this.prisma.criticalCase.findMany() },
            { name: 'critical_case_acompanhamentos', fetch: () => this.prisma.criticalCaseAcompanhamento.findMany() },
        ];

        for (const extractor of extractors) {
            try {
                const rows = await extractor.fetch();
                backupData[extractor.name] = rows;
                report[extractor.name] = rows.length;
                totalRecords += rows.length;
            } catch (err: any) {
                this.logger.warn(`Aviso ao extrair ${extractor.name}: ${err.message}`);
                backupData[extractor.name] = [];
                report[extractor.name] = 0;
            }
        }

        const backupDir = this.getBackupDir();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_itmizer_${timestamp}.json`;
        const filepath = path.join(backupDir, filename);

        const payload = {
            metadata: {
                timestamp: new Date().toISOString(),
                totalRecords,
                version: '1.0.1',
                tablesCount: Object.keys(backupData).length,
                report,
            },
            data: backupData,
        };

        fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf-8');
        const stat = fs.statSync(filepath);
        const fileSizeMb = (stat.size / (1024 * 1024)).toFixed(2);
        const fileSizeFormatted = stat.size > 1024 * 1024 ? `${fileSizeMb} MB` : `${(stat.size / 1024).toFixed(2)} KB`;

        const config = await this.getConfig();

        // Enviar para o Google Drive se ativado
        let googleDriveFileId: string | null = null;
        let googleDriveWebUrl: string | null = null;
        let googleDriveStatus = 'DISABLED';
        let googleDriveError: string | null = null;

        if (config.googleDriveEnabled && config.googleDriveFolderId) {
            googleDriveStatus = 'UPLOADING';
            const uploadRes = await this.googleDriveService.uploadFile(filepath, config.googleDriveFolderId);
            if (uploadRes.success) {
                googleDriveStatus = 'UPLOADED';
                googleDriveFileId = uploadRes.fileId || null;
                googleDriveWebUrl = uploadRes.webViewLink || null;
            } else {
                googleDriveStatus = 'FAILED';
                googleDriveError = uploadRes.error || 'Erro desconhecido no upload do Google Drive';
            }

            // Executa rotina de retenção de 15 dias no Google Drive
            try {
                await this.googleDriveService.cleanupOldBackups(config.googleDriveFolderId, config.retentionDays || 15);
            } catch (cleanErr: any) {
                this.logger.warn(`Erro na limpeza do Google Drive: ${cleanErr.message}`);
            }
        }

        // Executa limpeza local de arquivos com mais de retentionDays
        this.cleanupLocalBackups(backupDir, config.retentionDays || 15);

        // Grava o Log no banco
        const log = await this.prisma.systemBackupLog.create({
            data: {
                filename,
                filepath,
                fileSize: BigInt(stat.size),
                fileSizeFormatted,
                totalRecords,
                tablesCount: Object.keys(backupData).length,
                type,
                status: 'SUCCESS',
                googleDriveFileId,
                googleDriveFolderId: config.googleDriveFolderId,
                googleDriveStatus,
                googleDriveError,
                googleDriveWebUrl,
                details: report,
            },
        });

        // Atualiza status na config
        await this.prisma.systemBackupConfig.update({
            where: { id: 'default' },
            data: {
                lastRunAt: new Date(),
                lastStatus: 'SUCCESS',
                lastMessage: `Backup concluído (${totalRecords} registros em ${((Date.now() - startTime) / 1000).toFixed(2)}s). Drive: ${googleDriveStatus}`,
            },
        });

        return {
            ...log,
            fileSize: Number(log.fileSize),
        };
    }

    /**
     * Limpa backups locais antigos
     */
    private cleanupLocalBackups(backupDir: string, retentionDays: number = 15) {
        try {
            if (!fs.existsSync(backupDir)) return;
            const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
            const files = fs.readdirSync(backupDir);

            for (const file of files) {
                if (file.endsWith('.json') || file.endsWith('.sql') || file.endsWith('.dump')) {
                    const filePath = path.join(backupDir, file);
                    const stats = fs.statSync(filePath);
                    if (stats.mtimeMs < cutoffTime) {
                        fs.unlinkSync(filePath);
                        this.logger.log(`🗑️ Backup local expirado removido: ${file}`);
                    }
                }
            }
        } catch (error: any) {
            this.logger.warn(`Aviso na limpeza local de backups: ${error.message}`);
        }
    }

    /**
     * Obtém o caminho do arquivo para download
     */
    async getBackupFilePath(logId: string): Promise<string> {
        const log = await this.prisma.systemBackupLog.findUnique({
            where: { id: logId },
        });

        if (!log) {
            throw new Error('Registro de backup não encontrado.');
        }

        if (fs.existsSync(log.filepath)) {
            return log.filepath;
        }

        const fallback = path.join(this.getBackupDir(), log.filename);
        if (fs.existsSync(fallback)) {
            return fallback;
        }

        throw new Error(`Arquivo de backup não encontrado no disco local: ${log.filename}`);
    }

    /**
     * Restaura os dados a partir de um log específico ou arquivo mais recente
     */
    async restoreBackup(logId?: string) {
        let targetFilePath = '';

        if (logId) {
            targetFilePath = await this.getBackupFilePath(logId);
        } else {
            const backupDir = this.getBackupDir();
            const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.json')).sort().reverse();
            if (files.length === 0) {
                throw new Error('Nenhum arquivo de backup encontrado para restauração.');
            }
            targetFilePath = path.join(backupDir, files[0]);
        }

        const rawContent = fs.readFileSync(targetFilePath, 'utf-8');
        const parsed = JSON.parse(rawContent);
        const data = parsed.data || parsed;

        // Execução segura de restore
        let restoredCount = 0;
        const details: Record<string, number> = {};

        // Inserção em ordem de dependência referencial
        const inserters: { name: string; items: any[]; insert: (item: any) => Promise<any> }[] = [
            { name: 'users', items: data.users || [], insert: (i) => this.prisma.user.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'profiles', items: data.profiles || [], insert: (i) => this.prisma.profile.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'user_roles', items: data.user_roles || [], insert: (i) => this.prisma.userRole.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'clients', items: data.clients || [], insert: (i) => this.prisma.client.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'infrastructure_requirements', items: data.infrastructure_requirements || [], insert: (i) => this.prisma.infrastructureRequirement.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'server_requirements', items: data.server_requirements || [], insert: (i) => this.prisma.serverRequirement.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'terminal_requirements', items: data.terminal_requirements || [], insert: (i) => this.prisma.terminalRequirement.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'internet_requirements', items: data.internet_requirements || [], insert: (i) => this.prisma.internetRequirement.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'homologated_peripherals', items: data.homologated_peripherals || [], insert: (i) => this.prisma.homologatedPeripheral.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'menus', items: data.menus || [], insert: (i) => this.prisma.menu.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'submenus', items: data.submenus || [], insert: (i) => this.prisma.submenu.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'assessments', items: data.assessments || [], insert: (i) => this.prisma.assessment.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'assessment_history', items: data.assessment_history || [], insert: (i) => this.prisma.assessmentHistory.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'deployments', items: data.deployments || [], insert: (i) => this.prisma.deployment.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'deployment_history', items: data.deployment_history || [], insert: (i) => this.prisma.deploymentHistory.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'migrations', items: data.migrations || [], insert: (i) => this.prisma.migration.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'migration_history', items: data.migration_history || [], insert: (i) => this.prisma.migrationHistory.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'migration_lancamentos', items: data.migration_lancamentos || [], insert: (i) => this.prisma.migrationLancamento.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'recem_vr', items: data.recem_vr || [], insert: (i) => this.prisma.recemVr.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'recem_vr_acompanhamentos', items: data.recem_vr_acompanhamentos || [], insert: (i) => this.prisma.recemVrAcompanhamento.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'recem_vr_history', items: data.recem_vr_history || [], insert: (i) => this.prisma.recemVrHistory.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'client_infrastructure', items: data.client_infrastructure || [], insert: (i) => this.prisma.clientInfrastructure.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'client_credentials', items: data.client_credentials || [], insert: (i) => this.prisma.clientCredential.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'client_credential_access_logs', items: data.client_credential_access_logs || [], insert: (i) => this.prisma.clientCredentialAccessLog.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'client_tickets', items: data.client_tickets || [], insert: (i) => this.prisma.clientTicket.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'critical_cases', items: data.critical_cases || [], insert: (i) => this.prisma.criticalCase.upsert({ where: { id: i.id }, create: i, update: i }) },
            { name: 'critical_case_acompanhamentos', items: data.critical_case_acompanhamentos || [], insert: (i) => this.prisma.criticalCaseAcompanhamento.upsert({ where: { id: i.id }, create: i, update: i }) },
        ];

        for (const target of inserters) {
            let ok = 0;
            for (const item of target.items) {
                try {
                    await target.insert(item);
                    ok++;
                    restoredCount++;
                } catch (itemErr: any) {
                    this.logger.warn(`Aviso ao restaurar item em ${target.name}: ${itemErr.message}`);
                }
            }
            details[target.name] = ok;
        }

        return {
            success: true,
            totalRestored: restoredCount,
            details,
            filename: path.basename(targetFilePath),
        };
    }
}

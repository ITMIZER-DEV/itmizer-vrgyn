import { Injectable, Logger } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GoogleDriveService {
    private readonly logger = new Logger(GoogleDriveService.name);

    private getDriveClient(): drive_v3.Drive | null {
        try {
            const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON;
            const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
            const saKey = process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_DRIVE_PRIVATE_KEY;
            const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

            let auth: any = null;

            if (rawJson) {
                const parsed = JSON.parse(rawJson.startsWith('{') ? rawJson : Buffer.from(rawJson, 'base64').toString('utf-8'));
                auth = new google.auth.JWT({
                    email: parsed.client_email,
                    key: parsed.private_key,
                    scopes: ['https://www.googleapis.com/auth/drive'],
                });
            } else if (saEmail && saKey) {
                const formattedKey = saKey.replace(/\\n/g, '\n');
                auth = new google.auth.JWT({
                    email: saEmail,
                    key: formattedKey,
                    scopes: ['https://www.googleapis.com/auth/drive'],
                });
            } else if (credPath && fs.existsSync(credPath)) {
                auth = new google.auth.GoogleAuth({
                    keyFile: credPath,
                    scopes: ['https://www.googleapis.com/auth/drive'],
                });
            }

            if (!auth) {
                return null;
            }

            return google.drive({ version: 'v3', auth });
        } catch (error: any) {
            this.logger.error(`Erro ao inicializar cliente Google Drive: ${error.message}`);
            return null;
        }
    }

    /**
     * Testa se as credenciais e a pasta do Google Drive são válidas e acessíveis
     */
    async testConnection(folderId: string): Promise<{ success: boolean; message: string; folderName?: string }> {
        const drive = this.getDriveClient();
        if (!drive) {
            return {
                success: false,
                message: 'Credenciais do Google Drive não configuradas no servidor (.env). Configure GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_PRIVATE_KEY ou GOOGLE_SERVICE_ACCOUNT_JSON.',
            };
        }

        const cleanFolderId = this.extractFolderId(folderId);
        if (!cleanFolderId) {
            return {
                success: false,
                message: 'ID da pasta do Google Drive não informado ou inválido.',
            };
        }

        try {
            const res = await drive.files.get({
                fileId: cleanFolderId,
                fields: 'id, name, mimeType, capabilities',
                supportsAllDrives: true,
            });

            const folder = res.data;
            if (folder.mimeType !== 'application/vnd.google-apps.folder') {
                return {
                    success: false,
                    message: `O ID informado pertence a um arquivo (${folder.name}) e não a uma pasta do Google Drive.`,
                };
            }

            return {
                success: true,
                message: `Conexão bem-sucedida! Pasta "${folder.name}" identificada e pronta para receber backups.`,
                folderName: folder.name || 'Pasta Google Drive',
            };
        } catch (error: any) {
            this.logger.error(`Falha ao conectar no Google Drive (pasta ${cleanFolderId}): ${error.message}`);
            return {
                success: false,
                message: `Erro ao acessar pasta no Google Drive: ${error.message}. Verifique se a pasta está compartilhada com o e-mail da Conta de Serviço.`,
            };
        }
    }

    /**
     * Envia um arquivo para a pasta do Google Drive
     */
    async uploadFile(filePath: string, folderId: string): Promise<{
        success: boolean;
        fileId?: string;
        webViewLink?: string;
        error?: string;
    }> {
        const drive = this.getDriveClient();
        if (!drive) {
            return {
                success: false,
                error: 'Credenciais do Google Drive não configuradas no .env',
            };
        }

        const cleanFolderId = this.extractFolderId(folderId);
        if (!cleanFolderId) {
            return {
                success: false,
                error: 'ID da pasta do Google Drive inválido',
            };
        }

        if (!fs.existsSync(filePath)) {
            return {
                success: false,
                error: `Arquivo local não encontrado: ${filePath}`,
            };
        }

        try {
            const fileName = path.basename(filePath);
            const fileSize = fs.statSync(filePath).size;
            this.logger.log(`Iniciando upload de ${fileName} (${(fileSize / (1024 * 1024)).toFixed(2)} MB) para pasta Google Drive: ${cleanFolderId}`);

            const response = await drive.files.create({
                requestBody: {
                    name: fileName,
                    parents: [cleanFolderId],
                    description: `Backup automatizado ITmizer-VR gerado em ${new Date().toISOString()}`,
                },
                media: {
                    mimeType: 'application/json',
                    body: fs.createReadStream(filePath),
                },
                fields: 'id, name, webViewLink, webContentLink',
                supportsAllDrives: true,
            });

            this.logger.log(`✅ Upload concluído no Google Drive! File ID: ${response.data.id}`);

            return {
                success: true,
                fileId: response.data.id || undefined,
                webViewLink: response.data.webViewLink || undefined,
            };
        } catch (error: any) {
            this.logger.error(`Erro durante upload para o Google Drive: ${error.message}`);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Limpa backups antigos na pasta do Google Drive que excedem o tempo de retenção em dias
     */
    async cleanupOldBackups(folderId: string, retentionDays: number = 15): Promise<{ deletedCount: number }> {
        const drive = this.getDriveClient();
        if (!drive) return { deletedCount: 0 };

        const cleanFolderId = this.extractFolderId(folderId);
        if (!cleanFolderId) return { deletedCount: 0 };

        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            const cutoffIso = cutoffDate.toISOString();

            this.logger.log(`Verificando backups no Google Drive anteriores a ${cutoffIso} (Retenção: ${retentionDays} dias)...`);

            // Busca arquivos na pasta que foram criados antes do cutoffDate
            const query = `'${cleanFolderId}' in parents and trashed = false and createdTime < '${cutoffIso}'`;
            const listRes = await drive.files.list({
                q: query,
                fields: 'files(id, name, createdTime)',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
            });

            const files = listRes.data.files || [];
            let deletedCount = 0;

            for (const file of files) {
                if (file.id) {
                    try {
                        await drive.files.delete({
                            fileId: file.id,
                            supportsAllDrives: true,
                        });
                        this.logger.log(`🗑️ Backup expirado removido do Google Drive: ${file.name} (${file.id})`);
                        deletedCount++;
                    } catch (delErr: any) {
                        this.logger.warn(`Não foi possível remover arquivo ${file.id}: ${delErr.message}`);
                    }
                }
            }

            return { deletedCount };
        } catch (error: any) {
            this.logger.error(`Erro ao executar política de retenção no Google Drive: ${error.message}`);
            return { deletedCount: 0 };
        }
    }

    /**
     * Extrai o ID limpo da pasta caso o usuário cole a URL completa do Google Drive
     */
    private extractFolderId(input: string): string {
        if (!input) return '';
        const trimmed = input.trim();
        // Se for URL completa (ex: https://drive.google.com/drive/folders/0AAzNdB7t26iUUk9PVA)
        const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return match[1];
        }
        return trimmed;
    }
}

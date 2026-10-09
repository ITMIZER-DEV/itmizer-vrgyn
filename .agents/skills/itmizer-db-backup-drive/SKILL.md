---
name: itmizer-db-backup-drive
description: Padrão arquitetural completo para automação de backups PostgreSQL (pg_dump / pg_restore nativo e snapshot JSON), integração com Google Drive API (Service Account, Shared Drives, subpastas automáticas), política de retenção temporal e gestão via banco de dados e UI.
---

# 🛡️ Padrão de Backup de Banco de Dados PostgreSQL com Google Drive

Este guia estabelece o padrão arquitetural, scripts e componentes reutilizáveis para implementar rotinas completas de backup e restore no ecossistema de aplicações ITmizer (NestJS, Docker, PostgreSQL, Prisma, React, Google Cloud Drive API).

---

## 1. Visão Geral da Arquitetura

```
 ┌─────────────────────────────────────────────────────────────┐
 │                     Aplicação / NestJS                      │
 │                                                             │
 │  ┌─────────────────┐   Cron Diário   ┌───────────────────┐  │
 │  │   UI / React    │ ──────────────> │   BackupService   │  │
 │  │ (Ajuste Agenda, │                 └─────────┬─────────┘  │
 │  │  Upload JSON SA)│                           │            │
 │  └────────┬────────┘                           │            │
 │           │ Salva Configs no Banco             │            │
 │           v                                    v            │
 │  ┌─────────────────┐                 ┌───────────────────┐  │
 │  │   PostgreSQL    │ <────────────── │      pg_dump      │  │
 │  │ (Tabela Config) │   Snapshot .dump│  (Binário Nativo) │  │
 │  └─────────────────┘                 └─────────┬─────────┘  │
 └────────────────────────────────────────────────┼────────────┘
                                                  │
                                                  v
                                      ┌───────────────────────┐
                                      │  GoogleDriveService   │
                                      │   (Service Account)   │
                                      └───────────┬───────────┘
                                                  │
                                                  v
                                      ┌───────────────────────┐
                                      │     Google Drive      │
                                      │ Pasta Raiz / database │
                                      │  (Retenção: 15 dias)  │
                                      └───────────────────────┘
```

---

## 2. Pré-requisitos de Infraestrutura (Docker)

No container onde o backend executa, é obrigatório instalar os binários clientes do PostgreSQL (`pg_dump`, `pg_restore`, `psql`).

### `Dockerfile` (Alpine Multi-Stage):
```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app
# Instalar postgresql-client e openssl
RUN apk add --no-cache openssl postgresql-client
ENV NODE_ENV=production
# ... restante do Dockerfile
```

---

## 3. Modelo de Dados (Prisma Schema)

Grave as configurações e o histórico de execuções diretamente no banco para permitir controle via interface web sem necessidade de reiniciar containers:

```prisma
model SystemBackupConfig {
  id                        String    @id @default("default")
  scheduleEnabled           Boolean   @default(true) @map("schedule_enabled")
  scheduleTime              String    @default("00:00") @map("schedule_time")
  frequency                 String    @default("DAILY")
  googleDriveEnabled        Boolean   @default(true) @map("google_drive_enabled")
  googleDriveFolderId       String    @default("") @map("google_drive_folder_id")
  googleDriveFolderUrl      String?   @map("google_drive_folder_url")
  googleServiceAccountJson  String?   @db.Text @map("google_service_account_json")
  googleServiceAccountEmail String?   @map("google_service_account_email")
  googlePrivateKey          String?   @db.Text @map("google_private_key")
  retentionDays             Int       @default(15) @map("retention_days")
  backupFormat              String    @default("HYBRID") @map("backup_format")
  lastRunAt                 DateTime? @map("last_run_at")
  lastStatus                String?   @map("last_status")
  lastMessage               String?   @map("last_message")
  updatedAt                 DateTime  @updatedAt @map("updated_at")

  @@map("system_backup_configs")
}

model SystemBackupLog {
  id                  String   @id @default(uuid())
  filename            String
  filepath            String
  fileSize            BigInt   @map("file_size")
  fileSizeFormatted   String?  @map("file_size_formatted")
  totalRecords        Int      @default(0) @map("total_records")
  tablesCount         Int      @default(0) @map("tables_count")
  type                String   @default("AUTOMATIC") // AUTOMATIC | MANUAL
  status              String   @default("SUCCESS")   // SUCCESS | FAILED
  googleDriveFileId   String?  @map("google_drive_file_id")
  googleDriveFolderId String?  @map("google_drive_folder_id")
  googleDriveStatus   String   @default("PENDING")   // UPLOADED | FAILED | DISABLED
  googleDriveError    String?  @db.Text @map("google_drive_error")
  googleDriveWebUrl   String?  @map("google_drive_web_url")
  details             Json?
  createdAt           DateTime @default(now()) @map("created_at")

  @@map("system_backup_logs")
}
```

---

## 4. Google Drive Service (`google-drive.service.ts`)

Serviço com suporte a:
1. Chave da Service Account passada via banco de dados ou variáveis de ambiente.
2. Suporte a Drives Compartilhados (`supportsAllDrives: true`).
3. Criação/detecção automática da subpasta (ex: `database`).
4. Limpeza automática de arquivos antigos (política de retenção).

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

export interface DriveCredentialsDto {
    googleServiceAccountJson?: string | null;
    googleServiceAccountEmail?: string | null;
    googlePrivateKey?: string | null;
}

@Injectable()
export class GoogleDriveService {
    private readonly logger = new Logger(GoogleDriveService.name);

    private getDriveClient(creds?: DriveCredentialsDto): drive_v3.Drive | null {
        try {
            const rawJson = creds?.googleServiceAccountJson || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
            const saEmail = creds?.googleServiceAccountEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
            const saKey = creds?.googlePrivateKey || process.env.GOOGLE_PRIVATE_KEY;

            let auth: any = null;

            if (rawJson) {
                const parsed = JSON.parse(rawJson.startsWith('{') ? rawJson : Buffer.from(rawJson, 'base64').toString('utf-8'));
                auth = new google.auth.JWT({
                    email: parsed.client_email,
                    key: parsed.private_key,
                    scopes: ['https://www.googleapis.com/auth/drive'],
                });
            } else if (saEmail && saKey) {
                auth = new google.auth.JWT({
                    email: saEmail,
                    key: saKey.replace(/\\n/g, '\n'),
                    scopes: ['https://www.googleapis.com/auth/drive'],
                });
            }

            if (!auth) return null;
            return google.drive({ version: 'v3', auth });
        } catch (error: any) {
            this.logger.error(`Erro ao inicializar Google Drive: ${error.message}`);
            return null;
        }
    }

    private extractFolderId(input: string): string {
        if (!input) return '';
        const match = input.trim().match(/\/folders\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : input.trim();
    }

    async getOrCreateSubfolder(parentFolderId: string, subfolderName: string = 'database', creds?: DriveCredentialsDto): Promise<string> {
        const drive = this.getDriveClient(creds);
        if (!drive) throw new Error('Cliente Google Drive não autenticado');
        const cleanParentId = this.extractFolderId(parentFolderId);

        const listRes = await drive.files.list({
            q: `'${cleanParentId}' in parents and name = '${subfolderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: 'files(id, name)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        if (listRes.data.files && listRes.data.files.length > 0) {
            return listRes.data.files[0].id!;
        }

        const createRes = await drive.files.create({
            requestBody: {
                name: subfolderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [cleanParentId],
            },
            fields: 'id, name',
            supportsAllDrives: true,
        });

        return createRes.data.id!;
    }

    async uploadFile(filePath: string, parentFolderId: string, subfolderName: string = 'database', creds?: DriveCredentialsDto) {
        const drive = this.getDriveClient(creds);
        if (!drive) return { success: false, error: 'Credenciais ausentes' };

        const targetFolderId = await this.getOrCreateSubfolder(parentFolderId, subfolderName, creds);
        const fileName = path.basename(filePath);

        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [targetFolderId],
                description: `Backup automatizado gerado em ${new Date().toISOString()}`,
            },
            media: {
                mimeType: 'application/octet-stream',
                body: fs.createReadStream(filePath),
            },
            fields: 'id, name, webViewLink',
            supportsAllDrives: true,
        });

        return {
            success: true,
            fileId: response.data.id || undefined,
            webViewLink: response.data.webViewLink || undefined,
        };
    }

    async cleanupOldBackups(parentFolderId: string, retentionDays: number = 15, subfolderName: string = 'database', creds?: DriveCredentialsDto) {
        const drive = this.getDriveClient(creds);
        if (!drive) return { deletedCount: 0 };

        const targetFolderId = await this.getOrCreateSubfolder(parentFolderId, subfolderName, creds);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const listRes = await drive.files.list({
            q: `'${targetFolderId}' in parents and trashed = false and createdTime < '${cutoffDate.toISOString()}'`,
            fields: 'files(id, name, createdTime)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        let deletedCount = 0;
        for (const file of listRes.data.files || []) {
            if (file.id) {
                await drive.files.delete({ fileId: file.id, supportsAllDrives: true });
                deletedCount++;
            }
        }
        return { deletedCount };
    }
}
```

---

## 5. Execução Segura do `pg_dump` e `pg_restore`

### ⚠️ Regras Cruciais:
1. **Nunca passe a URL com query params (`?schema=public`) diretamente no `pg_dump`**: faça o parse de Host, Port, User, Password e Database.
2. **Injete a senha via `env: { PGPASSWORD: password }`**: evita expor credenciais em logs de processos do SO.
3. **Formato Custom (`-F c`)**:
   - `pg_dump`: **NÃO** use `--clean` ou `--if-exists` (são incompatíveis com `-F c`).
   - `pg_restore`: **USE** `--clean --if-exists --no-owner --no-privileges -v`.

### Snippet de Execução:
```typescript
private parseDatabaseUrl(dbUrl: string) {
    const parsed = new URL(dbUrl);
    return {
        host: parsed.hostname || 'localhost',
        port: parsed.port || '5432',
        user: decodeURIComponent(parsed.username || 'postgres'),
        password: decodeURIComponent(parsed.password || ''),
        database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'postgres',
    };
}

// Geração de Dump:
const cmd = `pg_dump -h "${pg.host}" -p "${pg.port}" -U "${pg.user}" -d "${pg.database}" -F c -b -v --no-owner --no-privileges -f "${filepath}"`;
await execAsync(cmd, { env: { ...process.env, PGPASSWORD: pg.password } });

// Restauração de Dump:
const cmd = `pg_restore -h "${pg.host}" -p "${pg.port}" -U "${pg.user}" -d "${pg.database}" --clean --if-exists --no-owner --no-privileges -v "${filepath}"`;
await execAsync(cmd, { env: { ...process.env, PGPASSWORD: pg.password } });
```

---

## 6. Agendamento Automático (`@Cron`)

No NestJS, utilize o `@nestjs/schedule`:
```typescript
@Cron('0 * * * *') // Executa a cada hora cheia
async handleScheduledCron() {
    const config = await this.getConfig();
    if (!config.scheduleEnabled) return;

    const currentHourStr = `${String(new Date().getHours()).padStart(2, '0')}:00`;
    const configuredHour = (config.scheduleTime || '00:00').split(':')[0] + ':00';

    if (currentHourStr === configuredHour) {
        await this.generateBackup('AUTOMATIC');
    }
}
```

---

## 7. Boas Práticas de Segurança e LGPD

1. **Proteção de Credenciais**: Arquivos `.json` de Service Account devem ser explicitamente ignorados no `.gitignore` (`*.json` de credenciais).
2. **Permissões Mínimas**: No Google Cloud, atribua a role básica à Service Account e compartilhe apenas a pasta específica do Google Drive com o e-mail da SA como **Editor**.
3. **Limpeza Local & Nuvem**: Sempre aplique a rotina de exclusão aos arquivos que ultrapassarem `retentionDays` para evitar estouro de disco no servidor e de cota no Google Drive.

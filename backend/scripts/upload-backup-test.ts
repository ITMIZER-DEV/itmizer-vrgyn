import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

async function uploadBackupToDrive() {
    console.log('====================================================');
    console.log('☁️ Enviando Backup Real para o Google Drive');
    console.log('====================================================');

    const keyFilePath = path.resolve(__dirname, '../../vrgyn-platform-845690315ce1.json');
    const keyData = JSON.parse(fs.readFileSync(keyFilePath, 'utf-8'));

    const auth = new google.auth.JWT({
        email: keyData.client_email,
        key: keyData.private_key,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const folderId = '0AAzNdB7t26iUUk9PVA';
    const backupFilePath = path.resolve(__dirname, '../../backups/backup_itmizer_2026-10-08T22-37-51-333Z.json');

    if (!fs.existsSync(backupFilePath)) {
        console.error('❌ Arquivo de backup não encontrado:', backupFilePath);
        process.exit(1);
    }

    const stat = fs.statSync(backupFilePath);
    console.log(`✓ Arquivo: ${path.basename(backupFilePath)}`);
    console.log(`✓ Tamanho: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`✓ Enviando para Pasta ID: ${folderId}...`);

    try {
        const response = await drive.files.create({
            requestBody: {
                name: path.basename(backupFilePath),
                parents: [folderId],
                description: `Backup automatizado ITmizer-VR gerado em ${new Date().toISOString()}`,
            },
            media: {
                mimeType: 'application/json',
                body: fs.createReadStream(backupFilePath),
            },
            fields: 'id, name, webViewLink, webContentLink',
            supportsAllDrives: true,
        });

        console.log('\n====================================================');
        console.log('🎉 SUCESSO! Backup gravado no Google Drive!');
        console.log(`🆔 File ID: ${response.data.id}`);
        console.log(`🔗 Link de Visualização: ${response.data.webViewLink}`);
        console.log('====================================================');
    } catch (error: any) {
        console.error('❌ Erro durante o upload:', error.message);
    }
}

uploadBackupToDrive();

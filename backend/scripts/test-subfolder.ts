import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

async function testSubfolderUpload() {
    console.log('====================================================');
    console.log('📁 Testando criação/uso de subpasta "database"');
    console.log('====================================================');

    const keyFilePath = path.resolve(__dirname, '../../vrgyn-platform-845690315ce1.json');
    const keyData = JSON.parse(fs.readFileSync(keyFilePath, 'utf-8'));

    const auth = new google.auth.JWT({
        email: keyData.client_email,
        key: keyData.private_key,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const parentFolderId = '0AAzNdB7t26iUUk9PVA';

    // 1. Procurar ou criar subpasta 'database'
    console.log(`Buscando subpasta "database" dentro de ${parentFolderId}...`);
    const query = `'${parentFolderId}' in parents and name = 'database' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const listRes = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
    });

    let databaseFolderId = '';
    if (listRes.data.files && listRes.data.files.length > 0) {
        databaseFolderId = listRes.data.files[0].id!;
        console.log(`✓ Subpasta "database" já existe! ID: ${databaseFolderId}`);
    } else {
        console.log('Criando subpasta "database"...');
        const createRes = await drive.files.create({
            requestBody: {
                name: 'database',
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentFolderId],
            },
            fields: 'id, name',
            supportsAllDrives: true,
        });
        databaseFolderId = createRes.data.id!;
        console.log(`✅ Subpasta "database" criada com sucesso! ID: ${databaseFolderId}`);
    }

    // 2. Fazer upload para a subpasta
    const backupFilePath = path.resolve(__dirname, '../../backups/backup_itmizer_2026-10-08T22-37-51-333Z.json');
    console.log(`Enviando ${path.basename(backupFilePath)} para a subpasta "database"...`);

    const uploadRes = await drive.files.create({
        requestBody: {
            name: path.basename(backupFilePath),
            parents: [databaseFolderId],
            description: `Backup automatizado ITmizer-VR gerado em ${new Date().toISOString()}`,
        },
        media: {
            mimeType: 'application/json',
            body: fs.createReadStream(backupFilePath),
        },
        fields: 'id, name, webViewLink',
        supportsAllDrives: true,
    });

    console.log('🎉 SUCESSO! Backup gravado dentro da subpasta "database"!');
    console.log(`🆔 File ID: ${uploadRes.data.id}`);
    console.log(`🔗 Link de Visualização: ${uploadRes.data.webViewLink}`);
    console.log('====================================================');
}

testSubfolderUpload();

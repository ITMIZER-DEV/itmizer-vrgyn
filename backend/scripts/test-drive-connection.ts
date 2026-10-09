import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

async function testDrive() {
    console.log('====================================================');
    console.log('🔍 Testando Conexão com Google Drive API');
    console.log('====================================================');

    const keyFilePath = path.resolve(__dirname, '../../vrgyn-platform-845690315ce1.json');
    if (!fs.existsSync(keyFilePath)) {
        console.error('❌ Arquivo de chave não encontrado em:', keyFilePath);
        process.exit(1);
    }

    const keyData = JSON.parse(fs.readFileSync(keyFilePath, 'utf-8'));
    console.log(`✓ Service Account Email: ${keyData.client_email}`);
    console.log(`✓ Project ID: ${keyData.project_id}`);

    const auth = new google.auth.JWT({
        email: keyData.client_email,
        key: keyData.private_key,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const folderId = '0AAzNdB7t26iUUk9PVA';

    try {
        console.log(`\nConsultando pasta do Google Drive: ${folderId}...`);
        const res = await drive.files.get({
            fileId: folderId,
            fields: 'id, name, mimeType, capabilities, owners',
            supportsAllDrives: true,
        });

        console.log('✅ Conexão estabelecida com Sucesso!');
        console.log(`📁 Nome da Pasta: ${res.data.name}`);
        console.log(`🆔 ID da Pasta: ${res.data.id}`);
        console.log(`🔒 Tipo MIME: ${res.data.mimeType}`);
        console.log(`✍️ Permissão de Escrita (canAddChildren): ${res.data.capabilities?.canAddChildren ? 'SIM' : 'NÃO'}`);
        console.log('====================================================');
    } catch (error: any) {
        console.error('\n❌ Erro ao acessar a pasta do Google Drive:', error.message);
        console.log('Dica: Certifique-se de que a pasta foi compartilhada com o e-mail:', keyData.client_email);
        process.exit(1);
    }
}

testDrive();

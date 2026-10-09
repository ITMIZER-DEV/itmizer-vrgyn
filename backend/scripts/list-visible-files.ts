import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

async function listVisibleFiles() {
    const keyFilePath = path.resolve(__dirname, '../../vrgyn-platform-845690315ce1.json');
    const keyData = JSON.parse(fs.readFileSync(keyFilePath, 'utf-8'));

    const auth = new google.auth.JWT({
        email: keyData.client_email,
        key: keyData.private_key,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    try {
        console.log('Buscando itens compartilhados com a Service Account...');
        const res = await drive.files.list({
            pageSize: 20,
            fields: 'files(id, name, mimeType, shared, driveId)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
            q: "trashed = false",
        });

        console.log(`Itens encontrados: ${res.data.files?.length || 0}`);
        res.data.files?.forEach(f => {
            console.log(`- [${f.mimeType}] ${f.name} (ID: ${f.id})`);
        });

        // Testar também Drives Compartilhados (Shared Drives)
        const drivesRes = await drive.drives.list({
            pageSize: 20,
        });
        console.log(`Drives compartilhados: ${drivesRes.data.drives?.length || 0}`);
        drivesRes.data.drives?.forEach(d => {
            console.log(`- [Shared Drive] ${d.name} (ID: ${d.id})`);
        });
    } catch (e: any) {
        console.error('Erro:', e.message);
    }
}

listVisibleFiles();

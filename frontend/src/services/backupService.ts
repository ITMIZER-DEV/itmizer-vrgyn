import api from './api';

export interface BackupConfig {
    id: string;
    scheduleEnabled: boolean;
    scheduleTime: string;
    frequency: string;
    googleDriveEnabled: boolean;
    googleDriveFolderId: string;
    googleDriveFolderUrl?: string;
    googleServiceAccountJson?: string;
    googleServiceAccountEmail?: string;
    retentionDays: number;
    backupFormat: string;
    lastRunAt?: string;
    lastStatus?: string;
    lastMessage?: string;
    updatedAt: string;
}

export interface BackupLog {
    id: string;
    filename: string;
    filepath: string;
    fileSize: number;
    fileSizeFormatted?: string;
    totalRecords: number;
    tablesCount: number;
    type: 'AUTOMATIC' | 'MANUAL';
    status: 'SUCCESS' | 'FAILED';
    googleDriveFileId?: string;
    googleDriveFolderId?: string;
    googleDriveStatus: 'UPLOADED' | 'FAILED' | 'DISABLED' | 'PENDING' | 'SKIPPED';
    googleDriveError?: string;
    googleDriveWebUrl?: string;
    details?: Record<string, number>;
    createdAt: string;
}

export interface TestDriveResponse {
    success: boolean;
    message: string;
    folderName?: string;
}

export const backupService = {
    async getConfig(): Promise<BackupConfig> {
        const response = await api.get<BackupConfig>('/backups/config');
        return response.data;
    },

    async updateConfig(dto: Partial<BackupConfig>): Promise<BackupConfig> {
        const response = await api.put<BackupConfig>('/backups/config', dto);
        return response.data;
    },

    async testGoogleDrive(folderId?: string, googleServiceAccountJson?: string): Promise<TestDriveResponse> {
        const response = await api.post<TestDriveResponse>('/backups/test-drive', { folderId, googleServiceAccountJson });
        return response.data;
    },

    async getLogs(): Promise<BackupLog[]> {
        const response = await api.get<BackupLog[]>('/backups/logs');
        return response.data;
    },

    async generateBackup(): Promise<BackupLog> {
        const response = await api.post<BackupLog>('/backups/generate');
        return response.data;
    },

    async restoreBackup(id: string): Promise<{ success: boolean; totalRestored: number; filename: string }> {
        const response = await api.post(`/backups/${id}/restore`);
        return response.data;
    },

    async downloadBackup(id: string, filename: string): Promise<void> {
        const response = await api.get(`/backups/${id}/download`, {
            responseType: 'blob',
        });
        const blob = new Blob([response.data], { type: 'application/json' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
    },
};

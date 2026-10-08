import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { BackupsContent } from '@/components/Admin/BackupsContent';

export default function BackupsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <BackupsContent />
            </div>
        </DashboardLayout>
    );
}

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { clientService } from '@/services/clientService';
import { migrationService, MigrationStatus, MigrationStatusLabels } from '@/services/migrationService';
import { deploymentService } from '@/services/deploymentService';
import { recemVrService } from '@/services/recemVrService';
import { RecemVrStatus, STATUS_LABELS as RECEM_VR_STATUS_LABELS } from '@/types/recemVr';
import { Users, Activity, MapIcon, LifeBuoy, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

const MIGRATION_PROGRESS: Record<MigrationStatus, number> = {
  pendente: 10,
  em_validacao: 35,
  em_andamento: 65,
  concluida: 100,
  cancelada: 0,
};

const RECEM_VR_DOT_COLORS: Record<RecemVrStatus, string> = {
  PLANEJAMENTO: 'bg-blue-500',
  EM_ANDAMENTO: 'bg-yellow-500',
  CRITICO: 'bg-red-500',
  FINALIZADA: 'bg-green-500',
  CANCELADA: 'bg-slate-400',
};

function daysSince(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: clientService.findAll,
    enabled: !!user,
  });

  const { data: migrations } = useQuery({
    queryKey: ['migrations'],
    queryFn: migrationService.findAll,
    enabled: !!user,
  });

  const { data: deployments } = useQuery({
    queryKey: ['deployments'],
    queryFn: deploymentService.findAll,
    enabled: !!user,
  });

  const { data: recemVrList } = useQuery({
    queryKey: ['recem-vr'],
    queryFn: recemVrService.findAll,
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const activeMigrations = (migrations ?? [])
    .filter((m) => m.status !== 'concluida' && m.status !== 'cancelada')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const now = new Date();
  const deploymentsThisMonth = (deployments ?? []).filter((d) => {
    const created = new Date(d.createdAt);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  });

  const recemVrCriticos = (recemVrList ?? []).filter((r) => r.status === 'CRITICO');

  const recemVrAtencao = (recemVrList ?? [])
    .filter((r) => r.status !== 'FINALIZADA' && r.status !== 'CANCELADA')
    .sort((a, b) => {
      if (a.status === 'CRITICO' && b.status !== 'CRITICO') return -1;
      if (b.status === 'CRITICO' && a.status !== 'CRITICO') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 6);

  const kpis = [
    { label: 'Clientes ativos', value: clients?.length ?? 0, icon: Users, valueClassName: '' },
    { label: 'Em migração', value: activeMigrations.length, icon: Activity, valueClassName: 'text-primary' },
    { label: 'Implantações no mês', value: deploymentsThisMonth.length, icon: MapIcon, valueClassName: '' },
    { label: 'Recém VR críticos', value: recemVrCriticos.length, icon: LifeBuoy, valueClassName: 'text-destructive' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema itmizer</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl border border-border overflow-hidden">
          {kpis.map(({ label, value, icon: Icon, valueClassName }) => (
            <div key={label} className="bg-card p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className={cn('text-2xl font-bold font-display', valueClassName)}>{value}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Migrações em andamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {activeMigrations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma migração em andamento.</p>
              ) : (
                activeMigrations.slice(0, 6).map((migration) => (
                  <button
                    key={migration.id}
                    type="button"
                    onClick={() => navigate(`/clients/${migration.clientId}`)}
                    className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{migration.client?.nomeFantasia ?? '-'}</p>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${MIGRATION_PROGRESS[migration.status] ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {MigrationStatusLabels[migration.status]}
                    </span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-primary" />
                Recém VR — atenção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {recemVrAtencao.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum Recém VR requer atenção.</p>
              ) : (
                recemVrAtencao.map((recemVr) => (
                  <button
                    key={recemVr.id}
                    type="button"
                    onClick={() => navigate(`/recem-vr/${recemVr.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors text-left"
                  >
                    <span className={cn('w-2 h-2 rounded-full shrink-0', RECEM_VR_DOT_COLORS[recemVr.status])} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{recemVr.client?.nomeFantasia ?? '-'}</p>
                      <p className="text-xs text-muted-foreground truncate">{RECEM_VR_STATUS_LABELS[recemVr.status]}</p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                      D+{daysSince(recemVr.dataPrimeiraReuniao || recemVr.createdAt)}
                    </span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

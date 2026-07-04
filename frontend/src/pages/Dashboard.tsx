import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { assessmentService } from '@/services/assessmentService';
import { migrationService } from '@/services/migrationService';
import { Activity, FileText, Users, TrendingUp, CheckCircle2, Clock, AlertCircle, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAssessments: 0,
    pendingAssessments: 0,
    completedAssessments: 0,
    totalMigrations: 0,
    pendingMigrations: 0,
    completedMigrations: 0,
  });
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const [assessments, migrations] = await Promise.all([
        assessmentService.findAll(),
        migrationService.findAll(),
      ]);

      setStats({
        totalAssessments: assessments.length,
        pendingAssessments: assessments.filter((a: any) => a.status === 'rascunho' || a.status === 'em_analise').length,
        completedAssessments: assessments.filter((a: any) => a.status === 'concluido').length,
        totalMigrations: migrations.length,
        pendingMigrations: migrations.filter((m: any) => m.status === 'pendente' || m.status === 'em_andamento').length,
        completedMigrations: migrations.filter((m: any) => m.status === 'concluida').length,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas', error);
    }
  };

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema itmizer</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/assessments')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Validações</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssessments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Validações de infraestrutura
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingAssessments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando conclusão
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedAssessments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Validações finalizadas
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/migration')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Migrações</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMigrations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de migrações
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Resumo de Validações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Concluídas</span>
                </div>
                <span className="font-bold">{stats.completedAssessments}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Em Análise</span>
                </div>
                <span className="font-bold">{stats.pendingAssessments}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Total</span>
                </div>
                <span className="font-bold">{stats.totalAssessments}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Resumo de Migrações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Concluídas</span>
                </div>
                <span className="font-bold">{stats.completedMigrations}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Em Andamento</span>
                </div>
                <span className="font-bold">{stats.pendingMigrations}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Total</span>
                </div>
                <span className="font-bold">{stats.totalMigrations}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/assessments')}
              className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <FileText className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Validações</h3>
              <p className="text-sm text-muted-foreground">
                Gerenciar validações de infraestrutura
              </p>
            </button>

            <button
              onClick={() => navigate('/migration')}
              className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <Activity className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Migrações</h3>
              <p className="text-sm text-muted-foreground">
                Acompanhar processos de migração
              </p>
            </button>

            <button
              onClick={() => navigate('/clients')}
              className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <Users className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Clientes</h3>
              <p className="text-sm text-muted-foreground">
                Gerenciar cadastro de clientes
              </p>
            </button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import { AssessmentData } from '@/types/assessment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '../StatusBadge';
import { PorteBadge } from '../PorteBadge';
import { validateAssessment, getOverallStatus, calculatePorte, getTotalPDVCount, getTotalBackofficeCount } from '@/utils/validation';
import {
  Building2,
  Network,
  Server,
  Monitor,
  Printer,
  Clock,
  Settings,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Store,
} from 'lucide-react';

interface ReviewStepProps {
  data: AssessmentData;
}

export function ReviewStep({ data }: ReviewStepProps) {
  const validationResults = validateAssessment(data);
  const overallStatus = getOverallStatus(validationResults);
  const porte = calculatePorte(data);
  const multiLojas = data.company.lojaTotalLojas > 1;

  const errorCount = validationResults.filter(r => r.status === 'error').length;
  const warningCount = validationResults.filter(r => r.status === 'warning').length;
  const okCount = validationResults.filter(r => r.status === 'ok').length;

  const statusConfig = {
    ok: {
      icon: CheckCircle,
      label: 'Infraestrutura Adequada',
      description: 'Todos os requisitos mínimos foram atendidos.',
      className: 'border-success bg-success/5',
    },
    warning: {
      icon: AlertTriangle,
      label: 'Ajustes Necessários',
      description: 'Alguns itens precisam de atenção.',
      className: 'border-warning bg-warning/5',
    },
    error: {
      icon: XCircle,
      label: 'Incompatibilidades Detectadas',
      description: 'Existem itens que não atendem aos requisitos mínimos.',
      className: 'border-destructive bg-destructive/5',
    },
  };

  const status = statusConfig[overallStatus];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`glass-card border-2 ${status.className}`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <StatusIcon className={`w-10 h-10 ${overallStatus === 'ok' ? 'text-success' : overallStatus === 'warning' ? 'text-warning' : 'text-destructive'}`} />
              <div>
                <h3 className="font-display font-semibold">{status.label}</h3>
                <p className="text-sm text-muted-foreground">{status.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Building2 className="w-10 h-10 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Porte Estimado</p>
                <div className="mt-1">
                  <PorteBadge porte={porte} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Store className="w-10 h-10 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Multi-Lojas</p>
                <p className="font-display font-semibold">
                  {multiLojas ? `Sim (${data.company.lojaTotalLojas} lojas)` : 'Não'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10">
          <CheckCircle className="w-6 h-6 text-success" />
          <div>
            <p className="text-2xl font-display font-bold text-success">{okCount}</p>
            <p className="text-xs text-muted-foreground">Adequados</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10">
          <AlertTriangle className="w-6 h-6 text-warning" />
          <div>
            <p className="text-2xl font-display font-bold text-warning">{warningCount}</p>
            <p className="text-xs text-muted-foreground">Alertas</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10">
          <XCircle className="w-6 h-6 text-destructive" />
          <div>
            <p className="text-2xl font-display font-bold text-destructive">{errorCount}</p>
            <p className="text-xs text-muted-foreground">Incompatíveis</p>
          </div>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-display">Resumo da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome Fantasia</p>
              <p className="font-medium">{data.company.nomeFantasia || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CNPJ</p>
              <p className="font-medium">{data.company.cnpj || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contato</p>
              <p className="font-medium">{data.company.contatoNome || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="font-medium">{data.company.contatoEmail || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Server className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-display font-bold">{data.servers.length}</p>
                <p className="text-sm text-muted-foreground">Servidores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Monitor className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-display font-bold">{getTotalPDVCount(data.pdvs)}</p>
                <p className="text-sm text-muted-foreground">PDVs ({data.pdvs.length} config{data.pdvs.length !== 1 ? 's' : ''})</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Monitor className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-display font-bold">{getTotalBackofficeCount(data.backoffice || [])}</p>
                <p className="text-sm text-muted-foreground">Retaguarda ({(data.backoffice || []).length} config{(data.backoffice || []).length !== 1 ? 's' : ''})</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Network className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-display font-bold">{data.network.links.length}</p>
                <p className="text-sm text-muted-foreground">Links Internet</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-display font-bold">
                  {[data.systems.integracaoCrm, data.systems.integracaoEcommerce, data.systems.integracaoMcommerce].filter(Boolean).length}
                </p>
                <p className="text-sm text-muted-foreground">Integrações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {validationResults.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-display">Resultados da Validação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg flex items-center gap-3 ${
                    result.status === 'ok'
                      ? 'bg-success/10'
                      : result.status === 'warning'
                      ? 'bg-warning/10'
                      : 'bg-destructive/10'
                  }`}
                >
                  <StatusBadge status={result.status} />
                  <span className="text-sm">{result.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

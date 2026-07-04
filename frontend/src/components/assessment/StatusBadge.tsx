import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'ok' | 'warning' | 'error';
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = {
    ok: {
      icon: CheckCircle,
      className: 'bg-success/10 text-success border-success/20',
      defaultLabel: 'Adequado',
    },
    warning: {
      icon: AlertTriangle,
      className: 'bg-warning/10 text-warning border-warning/20',
      defaultLabel: 'Atenção',
    },
    error: {
      icon: XCircle,
      className: 'bg-destructive/10 text-destructive border-destructive/20',
      defaultLabel: 'Incompatível',
    },
  };

  const { icon: Icon, className, defaultLabel } = config[status];

  return (
    <span className={cn('status-badge border', className)}>
      <Icon className="w-3.5 h-3.5" />
      {label || defaultLabel}
    </span>
  );
}

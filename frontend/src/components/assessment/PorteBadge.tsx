import { cn } from '@/lib/utils';
import { Building, Building2, Factory } from 'lucide-react';

interface PorteBadgeProps {
  porte: 'pequeno' | 'medio' | 'grande';
  showLabel?: boolean;
}

export function PorteBadge({ porte, showLabel = true }: PorteBadgeProps) {
  const config = {
    pequeno: {
      icon: Building,
      label: 'Pequeno',
      className: 'bg-accent text-accent-foreground',
    },
    medio: {
      icon: Building2,
      label: 'Médio',
      className: 'bg-primary/10 text-primary',
    },
    grande: {
      icon: Factory,
      label: 'Grande',
      className: 'bg-success/10 text-success',
    },
  };

  const { icon: Icon, label, className } = config[porte];

  return (
    <span className={cn('status-badge', className)}>
      <Icon className="w-4 h-4" />
      {showLabel && label}
    </span>
  );
}

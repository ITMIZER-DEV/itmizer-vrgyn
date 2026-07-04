import { cn } from '@/lib/utils';
import { Check, Building2, Network, Server, Monitor, Printer, Clock, Settings, FileText, Laptop, Briefcase, Database } from 'lucide-react';
import { AssessmentStep } from '@/types/assessment';

interface StepIndicatorProps {
  currentStep: AssessmentStep;
  onStepClick: (step: AssessmentStep) => void;
}

const steps: { key: AssessmentStep; label: string; icon: React.ElementType }[] = [
  { key: 'company', label: 'Empresa', icon: Building2 },
  { key: 'operational', label: 'Operacional', icon: Clock },
  { key: 'systems', label: 'Sistemas', icon: Settings },
  { key: 'migracao', label: 'Migração', icon: Database },
  { key: 'network', label: 'Rede', icon: Network },
  { key: 'servers', label: 'Servidores', icon: Server },
  { key: 'backoffice', label: 'Retaguarda', icon: Laptop },
  { key: 'pdvs', label: 'PDVs', icon: Monitor },
  { key: 'peripherals', label: 'Periféricos', icon: Printer },
  { key: 'projeto', label: 'Projeto', icon: Briefcase },
  { key: 'review', label: 'Revisão', icon: Check },
  { key: 'validation', label: 'Adequação', icon: FileText },
];

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.key === currentStep;
          const isCompleted = index < currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => onStepClick(step.key)}
                className={cn(
                  'flex flex-col items-center gap-2 transition-all duration-200',
                  isActive && 'scale-110',
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
                    isCompleted && 'bg-success text-success-foreground',
                    isActive && 'gradient-primary text-primary-foreground shadow-lg',
                    !isCompleted && !isActive && 'bg-muted text-muted-foreground',
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium hidden sm:block',
                    isActive && 'text-primary',
                    !isActive && 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2',
                    index < currentIndex ? 'bg-success' : 'bg-border',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

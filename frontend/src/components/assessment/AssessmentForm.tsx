import { useState, useEffect, useRef } from 'react';
import { AssessmentData, AssessmentStep } from '@/types/assessment';
import { StepIndicator } from './StepIndicator';
import { CompanyStep } from './steps/CompanyStep';
import { NetworkStep } from './steps/NetworkStep';
import { ServersStep } from './steps/ServersStep';
import { PDVsStep } from './steps/PDVsStep';
import { PeripheralsStep } from './steps/PeripheralsStep';
import { OperationalStep } from './steps/OperationalStep';
import { SystemsStep } from './steps/SystemsStep';
import { BackofficeStep } from './steps/BackofficeStep';
import { ProjetoStep } from './steps/ProjetoStep';
import { MigracaoStep } from './steps/MigracaoStep';
import { ReviewStep } from './steps/ReviewStep';
import { ValidationReport } from './ValidationReport';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, FileDown } from 'lucide-react';
import { saveAssessment } from '@/utils/storage';
import { assessmentService } from '@/services/assessmentService';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { validateAssessment, getOverallStatus } from '@/utils/validation';

interface AssessmentFormProps {
  data: AssessmentData;
  onChange: (data: AssessmentData) => void;
}

const stepOrder: AssessmentStep[] = [
  'company',
  'operational',
  'systems',
  'migracao',
  'network',
  'servers',
  'backoffice',
  'pdvs',
  'peripherals',
  'projeto',
  'review',
  'validation',
];

export function AssessmentForm({ data, onChange }: AssessmentFormProps) {
  const [currentStep, setCurrentStep] = useState<AssessmentStep>('company');
  const { toast } = useToast();
  const { canEdit } = usePermissions('/assessments');
  const isReadOnly = !canEdit;
  const isSavingRef = useRef(false);

  const currentIndex = stepOrder.indexOf(currentStep);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === stepOrder.length - 1;

  const handleNext = () => {
    if (!isLast) {
      if (canEdit) {
        assessmentService.update(data.id, data).catch(console.error);
      }
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      if (canEdit) {
        assessmentService.update(data.id, data).catch(console.error);
      }
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleSave = async () => {
    try {
      saveAssessment(data);
      await assessmentService.update(data.id, data);
      toast({
        title: 'Salvo com sucesso!',
        description: 'Os dados foram persistidos no servidor.',
      });
    } catch (error) {
      console.error('Erro ao salvar no servidor:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Os dados foram salvos apenas localmente.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-${data.company.nomeFantasia || 'novo'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Exportado!',
      description: 'O arquivo foi baixado.',
    });
  };

  useEffect(() => {
    if (!canEdit) return;

    const timer = setTimeout(async () => {
      if (isSavingRef.current) return; // evita requests concorrentes
      isSavingRef.current = true;
      saveAssessment(data);
      try {
        await assessmentService.update(data.id, data);
      } catch (error: any) {
        if (error.userMessage) {
          toast({ title: 'Erro ao salvar', description: error.userMessage, variant: 'destructive' });
        }
      } finally {
        isSavingRef.current = false;
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [data, canEdit]);

  const renderStep = () => {
    switch (currentStep) {
      case 'company':
        return (
          <CompanyStep
            data={data.company}
            onChange={company => onChange({ ...data, company })}
            isReadOnly={isReadOnly}
          />
        );
      case 'network':
        return (
          <NetworkStep
            data={data.network}
            onChange={network => onChange({ ...data, network })}
            isReadOnly={isReadOnly}
          />
        );
      case 'servers':
        return (
          <ServersStep
            data={data.servers}
            onChange={servers => onChange({ ...data, servers })}
            isReadOnly={isReadOnly}
          />
        );
      case 'backoffice':
        return (
          <BackofficeStep
            data={data.backoffice || []}
            onChange={backoffice => onChange({ ...data, backoffice })}
            isReadOnly={isReadOnly}
          />
        );
      case 'pdvs':
        return (
          <PDVsStep
            data={data.pdvs}
            onChange={pdvs => onChange({ ...data, pdvs })}
            isReadOnly={isReadOnly}
          />
        );
      case 'peripherals':
        return (
          <PeripheralsStep
            data={data.peripherals}
            onChange={peripherals => onChange({ ...data, peripherals })}
            isReadOnly={isReadOnly}
          />
        );
      case 'operational':
        return (
          <OperationalStep
            data={data.operational}
            onChange={operational => onChange({ ...data, operational })}
            isReadOnly={isReadOnly}
          />
        );
      case 'systems':
        return (
          <SystemsStep
            data={data.systems}
            onChange={systems => onChange({ ...data, systems })}
            isReadOnly={isReadOnly}
          />
        );
      case 'projeto':
        return (
          <ProjetoStep
            data={data.projeto}
            onChange={projeto => onChange({ ...data, projeto })}
            isReadOnly={isReadOnly}
          />
        );
      case 'migracao':
        return (
          <MigracaoStep
            data={data.migracao}
            onChange={migracao => onChange({ ...data, migracao })}
            isReadOnly={isReadOnly}
          />
        );
      case 'review':
        return <ReviewStep data={data} />;
      case 'validation':
        return <ValidationReport assessmentId={data.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={currentStep} onStepClick={setCurrentStep} />

      <div className="min-h-[500px]">{renderStep()}</div>

      <div className="flex items-center justify-between pt-6 border-t border-border">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={isFirst}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" />
              Salvar
            </Button>
          )}
          {isLast && (
            <Button variant="outline" onClick={handleExport}>
              <FileDown className="w-4 h-4 mr-1" />
              Exportar JSON
            </Button>
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={isLast}
          className="gradient-primary"
        >
          Próximo
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

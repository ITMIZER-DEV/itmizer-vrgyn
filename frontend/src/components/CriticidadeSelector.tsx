import { cn } from '@/lib/utils';
import { CRITICIDADE_PERIODICIDADE } from '@/types/recemVr';
import type { RecemVrCriticidade } from '@/types/recemVr';

const OPTIONS: {
  value: RecemVrCriticidade;
  label: string;
  numero: string;
  desc: string;
  bg: string;
  border: string;
  dot: string;
  text: string;
}[] = [
  {
    value: 'BAIXA',
    label: 'Baixa',
    numero: '1',
    desc: 'Cliente estável',
    bg: 'bg-green-50 hover:bg-green-100',
    border: 'border-green-300',
    dot: 'bg-green-500',
    text: 'text-green-800',
  },
  {
    value: 'MEDIA',
    label: 'Média',
    numero: '2',
    desc: 'Requer atenção',
    bg: 'bg-yellow-50 hover:bg-yellow-100',
    border: 'border-yellow-300',
    dot: 'bg-yellow-500',
    text: 'text-yellow-800',
  },
  {
    value: 'ALTA',
    label: 'Alta',
    numero: '3',
    desc: 'Cliente em risco',
    bg: 'bg-red-50 hover:bg-red-100',
    border: 'border-red-300',
    dot: 'bg-red-500',
    text: 'text-red-800',
  },
];

interface CriticidadeSelectorProps {
  value: RecemVrCriticidade;
  onChange: (value: RecemVrCriticidade) => void;
  disabled?: boolean;
}

export function CriticidadeSelector({ value, onChange, disabled }: CriticidadeSelectorProps) {
  return (
    <div className="flex gap-3">
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 transition-all cursor-pointer',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              selected
                ? `${opt.bg} ${opt.border} shadow-sm scale-[1.02]`
                : 'bg-white border-slate-200 hover:border-slate-300',
              disabled && 'opacity-60 cursor-not-allowed pointer-events-none',
            )}
          >
            {/* Círculo numerado */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white transition-colors',
                selected ? opt.dot : 'bg-slate-300',
              )}
            >
              {opt.numero}
            </div>

            {/* Texto */}
            <span
              className={cn(
                'text-sm font-semibold',
                selected ? opt.text : 'text-slate-600',
              )}
            >
              {opt.label}
            </span>
            <span className="text-xs text-muted-foreground text-center leading-tight">
              {opt.desc}
            </span>
            <span className="text-xs text-muted-foreground text-center leading-tight">
              {CRITICIDADE_PERIODICIDADE[opt.value]}
            </span>

            {/* Indicador selecionado */}
            <div
              className={cn(
                'w-4 h-4 rounded-full border-2 mt-0.5 transition-all',
                selected
                  ? `${opt.dot} border-transparent`
                  : 'border-slate-300 bg-white',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

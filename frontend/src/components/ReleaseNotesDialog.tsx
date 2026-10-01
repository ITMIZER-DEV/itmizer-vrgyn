import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Tag, GitCommit, Calendar, Rocket, ShieldCheck } from 'lucide-react';
import { APP_VERSION, APP_BUILD, SYSTEM_NAME, RELEASE_HISTORY } from '@/config/version';

interface ReleaseNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReleaseNotesDialog({ open, onOpenChange }: ReleaseNotesDialogProps) {
  const getBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'major':
        return {
          label: 'Major Release',
          className: 'bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-950/40 dark:text-red-400',
        };
      case 'minor':
        return {
          label: 'Nova Funcionalidade',
          className: 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary',
        };
      case 'patch':
      default:
        return {
          label: 'Melhoria / Correção',
          className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400',
        };
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.slice(0, 10).split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden border-border/60 shadow-2xl">
        {/* Header com estilo premium */}
        <div className="relative bg-gradient-to-br from-primary/10 via-background to-muted/40 p-6 border-b border-border/50">
          <div className="absolute top-4 right-10 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-background/80 border border-border/60 shadow-sm backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Versão Ativa: v{APP_VERSION}
            </span>
          </div>

          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
                  Novidades & Histórico de Releases
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {SYSTEM_NAME} • Build #{APP_BUILD}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Linha do tempo das releases */}
        <ScrollArea className="p-6 max-h-[calc(85vh-140px)]">
          <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60">
            {RELEASE_HISTORY && RELEASE_HISTORY.length > 0 ? (
              RELEASE_HISTORY.map((item, index) => {
                const badgeInfo = getBadgeVariant(item.type);
                const isCurrent = item.version === APP_VERSION;

                return (
                  <div key={item.version || index} className="relative group">
                    {/* Marcador na linha do tempo */}
                    <div
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110 ${
                        isCurrent
                          ? 'bg-primary border-background ring-4 ring-primary/20'
                          : 'bg-background border-muted-foreground/40'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-background' : 'bg-muted-foreground'}`} />
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card/60 hover:bg-card/90 transition-colors p-4 shadow-sm space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-foreground font-mono flex items-center gap-1.5">
                            <Tag className="w-4 h-4 text-primary" />
                            v{item.version}
                          </span>
                          {isCurrent && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-2xs font-semibold py-0">
                              Atual
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-2xs font-medium py-0 border ${badgeInfo.className}`}>
                            {badgeInfo.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 opacity-70" />
                            {formatDate(item.date)}
                          </span>
                          {item.build && (
                            <span className="flex items-center gap-1 font-mono text-2xs bg-muted px-1.5 py-0.5 rounded">
                              <GitCommit className="w-3 h-3 opacity-60" />
                              build #{item.build}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line pl-1 border-l-2 border-primary/20">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto opacity-30 mb-2" />
                <p className="text-sm">Nenhum histórico registrado no momento.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';

export interface CommandPaletteItem {
    id: string;
    label: string;
    route: string;
    icon?: string;
    kind: 'Página' | 'Ação';
}

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: CommandPaletteItem[];
}

function PaletteIcon({ name }: { name?: string }) {
    const IconComponent = name ? (LucideIcons as any)[name] : null;
    return (
        <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-[5px] bg-muted text-muted-foreground mr-2">
            {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
        </span>
    );
}

export function CommandPalette({ open, onOpenChange, items }: CommandPaletteProps) {
    const navigate = useNavigate();

    const handleSelect = (route: string) => {
        onOpenChange(false);
        navigate(route);
    };

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Buscar telas…" />
            <CommandList>
                <CommandEmpty>Nada encontrado.</CommandEmpty>
                <CommandGroup>
                    {items.map((item) => (
                        <CommandItem key={item.id} value={item.label} onSelect={() => handleSelect(item.route)}>
                            <PaletteIcon name={item.icon} />
                            <span className="flex-1">{item.label}</span>
                            <span className="text-2xs uppercase text-muted-foreground ml-auto">{item.kind}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}

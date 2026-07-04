import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientService, Client } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Building2, Plus, UserPlus, CheckCircle2 } from 'lucide-react';
import { ClientModal } from '@/pages/Clients/ClientModal';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NewAssessmentDialogProps {
    onCreateWithClient: (client: Client) => void;
    children?: React.ReactNode;
}

export function NewAssessmentDialog({ onCreateWithClient, children }: NewAssessmentDialogProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Client[]>([]);

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: clientService.findAll,
        enabled: open,
    });

    useEffect(() => {
        if (searchTerm.length >= 3 && clients) {
            const filtered = clients.filter(client =>
                client.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.cnpj.includes(searchTerm) ||
                (client.razaoSocial && client.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setSearchResults(filtered);
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, clients]);

    const handleSelectClient = (client: Client) => {
        setOpen(false);
        onCreateWithClient(client);
    };

    const handleClientCreated = (client: Client) => {
        // Automatically select the newly created client
        handleSelectClient(client);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="gradient-primary" size="lg">
                        <Plus className="w-5 h-5 mr-2" />
                        Nova Validação
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Iniciar Nova Validação
                    </DialogTitle>
                    <DialogDescription>
                        Selecione um cliente para iniciar o processo de validação de infraestrutura.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="search">Buscar Cliente</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Nome Fantasia ou CNPJ (mín. 3 caracteres)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span>Resultados</span>
                            <ClientModal onSuccess={handleClientCreated}>
                                <Button variant="ghost" size="sm" className="h-8 text-primary gap-1">
                                    <UserPlus className="w-4 h-4" />
                                    Novo Cliente
                                </Button>
                            </ClientModal>
                        </div>

                        <ScrollArea className="h-[200px] rounded-md border p-2">
                            {searchTerm.length < 3 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm py-8 space-y-2">
                                    <Search className="w-8 h-8 opacity-20" />
                                    <p>Digite pelo menos 3 caracteres...</p>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm py-8 space-y-2">
                                    <Building2 className="w-8 h-8 opacity-20" />
                                    <p>Nenhum cliente encontrado.</p>
                                    <ClientModal onSuccess={handleClientCreated}>
                                        <Button variant="outline" size="sm" className="mt-2">
                                            Cadastrar "{searchTerm}"
                                        </Button>
                                    </ClientModal>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {searchResults.map((client) => (
                                        <button
                                            key={client.id}
                                            onClick={() => handleSelectClient(client)}
                                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                                        >
                                            <div>
                                                <p className="font-medium text-sm text-foreground">{client.nomeFantasia}</p>
                                                <p className="text-xs text-muted-foreground">{client.cnpj}</p>
                                            </div>
                                            <CheckCircle2 className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

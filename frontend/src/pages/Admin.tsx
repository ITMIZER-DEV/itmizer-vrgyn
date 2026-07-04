import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Shield, Server, Cpu, Plus, Trash2, ArrowLeft, Users, Menu as MenuIcon } from 'lucide-react';
import { UsersListContent } from './Users/List';
import { InfrastructureContent } from '@/components/Admin/InfrastructureContent';
import { MenusManager } from '@/components/Admin/MenusManager';


interface Peripheral {
  id: string;
  category: string;
  brand: string;
  model: string;
  is_active: boolean;
}

export default function Admin({ defaultTab = 'requirements' }: { defaultTab?: string }) {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [peripherals, setPeripherals] = useState<Peripheral[]>([]);
  const [isAddingPeriph, setIsAddingPeriph] = useState(false);

  // Form states for peripherals
  const [periphCategory, setPeriphCategory] = useState('');
  const [periphBrand, setPeriphBrand] = useState('');
  const [periphModel, setPeriphModel] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && !isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta área.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchPeripherals();
    }
  }, [isAdmin]);

  const fetchPeripherals = async () => {
    const { data, error } = await supabase
      .from('homologated_peripherals')
      .select('*')
      .order('category');

    if (!error && data) {
      setPeripherals(data);
    }
  };


  const handleAddPeripheral = async () => {
    const { error } = await supabase
      .from('homologated_peripherals')
      .insert({
        category: periphCategory,
        brand: periphBrand,
        model: periphModel,
      });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Periférico adicionado.' });
      fetchPeripherals();
      setIsAddingPeriph(false);
      setPeriphCategory('');
      setPeriphBrand('');
      setPeriphModel('');
    }
  };

  const handleDeletePeripheral = async (id: string) => {
    const { error } = await supabase
      .from('homologated_peripherals')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Periférico removido.' });
      fetchPeripherals();
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')} className="hover:bg-primary/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-display">Painel Administrativo</h1>
                <p className="text-muted-foreground">Configurações de infraestrutura e gestão</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="requirements" className="gap-2">
              <Server className="w-4 h-4" />
              Infraestrutura
            </TabsTrigger>
            <TabsTrigger value="peripherals" className="gap-2">
              <Cpu className="w-4 h-4" />
              Periféricos Homologados
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="menus" className="gap-2">
              <MenuIcon className="w-4 h-4" />
              Menus & Navegação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requirements">
            <InfrastructureContent />
          </TabsContent>

          <TabsContent value="peripherals">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Periféricos Homologados</CardTitle>
                  <CardDescription>Lista de periféricos compatíveis com o sistema</CardDescription>
                </div>
                <Dialog open={isAddingPeriph} onOpenChange={setIsAddingPeriph}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Periférico</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Categoria</Label>
                        <Select value={periphCategory} onValueChange={setPeriphCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="impressora_fiscal">Impressora Fiscal</SelectItem>
                            <SelectItem value="scanner">Scanner</SelectItem>
                            <SelectItem value="pinpad">Pinpad</SelectItem>
                            <SelectItem value="sat">SAT</SelectItem>
                            <SelectItem value="balanca">Balança</SelectItem>
                            <SelectItem value="impressora_etiqueta">Impressora de Etiqueta</SelectItem>
                            <SelectItem value="coletor">Coletor de Dados</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Marca</Label>
                        <Input value={periphBrand} onChange={(e) => setPeriphBrand(e.target.value)} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Modelo</Label>
                        <Input value={periphModel} onChange={(e) => setPeriphModel(e.target.value)} />
                      </div>
                    </div>
                    <Button onClick={handleAddPeripheral}>Salvar</Button>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {peripherals.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="capitalize">{p.category.replace('_', ' ')}</TableCell>
                        <TableCell>{p.brand}</TableCell>
                        <TableCell>{p.model}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePeripheral(p.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <UsersListContent />
          </TabsContent>

          <TabsContent value="menus">
            <MenusManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

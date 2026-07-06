import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { infrastructureService, ServerRequirement, TerminalRequirement, InternetRequirement } from '@/services/infrastructureService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Server, Monitor, Globe, Info, Pencil, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function Infrastructure() {
    const [servers, setServers] = useState<ServerRequirement[]>([]);
    const [terminals, setTerminals] = useState<TerminalRequirement[]>([]);
    const [internet, setInternet] = useState<InternetRequirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<{ type: 'server' | 'terminal' | 'internet', data: any } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [sData, tData, iData] = await Promise.all([
                infrastructureService.getServers(),
                infrastructureService.getTerminals(),
                infrastructureService.getInternet()
            ]);
            setServers(sData);
            setTerminals(tData);
            setInternet(iData);
        } catch (error) {
            console.error('Erro ao carregar dados de infraestrutura', error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os dados de infraestrutura.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (type: 'server' | 'terminal' | 'internet', id: string, data: any) => {
        try {
            setIsSaving(true);
            // Remove id and timestamps from data before sending
            const { id: _, createdAt, updatedAt, ...updateData } = data;

            if (type === 'server') await infrastructureService.updateServer(id, updateData);
            else if (type === 'terminal') await infrastructureService.updateTerminal(id, updateData);
            else if (type === 'internet') await infrastructureService.updateInternet(id, updateData);

            toast({
                title: "Sucesso",
                description: "Requisito atualizado com sucesso.",
            });
            setEditingItem(null);
            fetchData();
        } catch (error) {
            console.error('Erro ao atualizar infraestrutura', error);
            toast({
                title: "Erro",
                description: "Não foi possível atualizar o requisito.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="font-display text-2xl font-bold">Configurações de Infraestrutura</h1>
                <p className="text-muted-foreground mt-1">Requisitos homologados para implantação do sistema VR Software</p>
            </div>

            <Tabs defaultValue="servers" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="servers" className="gap-2">
                        <Server className="w-4 h-4" />
                        Servidores
                    </TabsTrigger>
                    <TabsTrigger value="terminals" className="gap-2">
                        <Monitor className="w-4 h-4" />
                        Terminais
                    </TabsTrigger>
                    <TabsTrigger value="internet" className="gap-2">
                        <Globe className="w-4 h-4" />
                        Internet
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="servers">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Configurações de Servidores</CardTitle>
                            <CardDescription>Requisitos baseados na quantidade de PDVs e tipo de função</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Role</TableHead>
                                        <TableHead>SO</TableHead>
                                        <TableHead>PDVs</TableHead>
                                        <TableHead>RAM</TableHead>
                                        <TableHead>CPU</TableHead>
                                        <TableHead>Storage</TableHead>
                                        <TableHead>Observações</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {servers.map((s) => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-medium">
                                                {s.role}
                                                {s.isRecommended && (
                                                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 hover:bg-green-100">
                                                        Recomendado
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{s.os}</TableCell>
                                            <TableCell>{s.qntPdvsMin === 101 ? '101+' : `${s.qntPdvsMin} - ${s.qntPdvsMax}`}</TableCell>
                                            <TableCell>{s.ramGb > 0 ? `${s.ramGb} GB` : 'Custom'}</TableCell>
                                            <TableCell>
                                                <div className="text-xs">
                                                    <p>{s.cpuModel}</p>
                                                    {s.cpuCores > 0 && <p className="text-muted-foreground">{s.cpuCores} Cores</p>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs">
                                                    <p>{s.storageType}</p>
                                                    {s.storageGb > 0 && <p className="text-muted-foreground">{s.storageGb} GB</p>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] text-xs">
                                                {s.software && <p className="font-semibold">{s.software}</p>}
                                                <p className="text-muted-foreground">{s.recommendedOs}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditingItem({ type: 'server', data: { ...s } })}
                                                >
                                                    <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="terminals">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Configurações de Terminais</CardTitle>
                            <CardDescription>Requisitos para PDVs e Estações de Trabalho</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Aplicação</TableHead>
                                        <TableHead>SO</TableHead>
                                        <TableHead>RAM</TableHead>
                                        <TableHead>CPU</TableHead>
                                        <TableHead>HD</TableHead>
                                        <TableHead>Observações</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {terminals.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="font-medium">{t.terminalType}</TableCell>
                                            <TableCell>{t.application}</TableCell>
                                            <TableCell>
                                                <div className="text-xs">
                                                    <p>{t.os}</p>
                                                    <p className="text-muted-foreground">{t.soDistribution}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{t.ramGb} GB</TableCell>
                                            <TableCell className="text-xs">{t.cpuModel}</TableCell>
                                            <TableCell>
                                                <div className="text-xs">
                                                    <p>{t.storageType}</p>
                                                    <p className="text-muted-foreground">{t.storageGb} GB</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{t.observations}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditingItem({ type: 'terminal', data: { ...t } })}
                                                >
                                                    <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="internet">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Requisitos de Internet</CardTitle>
                            <CardDescription>Necessidades de conectividade para operação</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tipo de Link</TableHead>
                                        <TableHead>Upload</TableHead>
                                        <TableHead>Download</TableHead>
                                        <TableHead>Observações</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {internet.map((i) => (
                                        <TableRow key={i.id}>
                                            <TableCell className="font-medium">{i.linkType}</TableCell>
                                            <TableCell>{i.uploadMb} Mbps</TableCell>
                                            <TableCell>{i.downloadMb} Mbps</TableCell>
                                            <TableCell className="text-sm">{i.observations}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditingItem({ type: 'internet', data: { ...i } })}
                                                >
                                                    <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="mt-6 p-4 bg-primary/5 rounded-lg flex gap-3 border border-primary/10">
                                <Info className="w-5 h-5 text-primary flex-shrink-0" />
                                <p className="text-sm text-primary/80">
                                    Valores mínimos recomendados. Para redes com alto tráfego de dados (e-commerce, multi-lojas), recomenda-se avaliação específica do link de internet.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Editar Requisito {editingItem?.type === 'server' ? 'de Servidor' : editingItem?.type === 'terminal' ? 'de Terminal' : 'de Internet'}
                        </DialogTitle>
                        <DialogDescription>
                            Altere os valores técnicos para as validações automáticas do sistema.
                        </DialogDescription>
                    </DialogHeader>

                    {editingItem && (
                        <div className="grid gap-4 py-4">
                            {editingItem.type === 'server' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="role">Papel/Role</Label>
                                            <Input id="role" value={editingItem.data.role} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, role: e.target.value } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="os">Sistema Operacional Base</Label>
                                            <Input id="os" value={editingItem.data.os} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, os: e.target.value } })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ramGb">RAM (GB)</Label>
                                            <Input id="ramGb" type="number" value={editingItem.data.ramGb} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, ramGb: parseInt(e.target.value) || 0 } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cpuCores">CPU Cores</Label>
                                            <Input id="cpuCores" type="number" value={editingItem.data.cpuCores} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, cpuCores: parseInt(e.target.value) || 0 } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="storageGb">Storage (GB)</Label>
                                            <Input id="storageGb" type="number" value={editingItem.data.storageGb} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, storageGb: parseInt(e.target.value) || 0 } })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cpuModel">Modelo de CPU Mínimo</Label>
                                        <Input id="cpuModel" value={editingItem.data.cpuModel} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, cpuModel: e.target.value } })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="qntPdvsMin">PDVs Mín.</Label>
                                            <Input id="qntPdvsMin" type="number" value={editingItem.data.qntPdvsMin} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, qntPdvsMin: parseInt(e.target.value) || 0 } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="qntPdvsMax">PDVs Máx.</Label>
                                            <Input id="qntPdvsMax" type="number" value={editingItem.data.qntPdvsMax} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, qntPdvsMax: parseInt(e.target.value) || 0 } })} />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="recommended" checked={editingItem.data.isRecommended} onCheckedChange={(checked) => setEditingItem({ ...editingItem, data: { ...editingItem.data, isRecommended: checked === true } })} />
                                        <Label htmlFor="recommended">Configuração Recomendada</Label>
                                    </div>
                                </>
                            )}

                            {editingItem.type === 'terminal' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="terminalType">Tipo de Terminal</Label>
                                            <Input id="terminalType" value={editingItem.data.terminalType} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, terminalType: e.target.value } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="application">Aplicação</Label>
                                            <Input id="application" value={editingItem.data.application} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, application: e.target.value } })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ramGb">RAM (GB)</Label>
                                            <Input id="ramGb" type="number" value={editingItem.data.ramGb} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, ramGb: parseInt(e.target.value) || 0 } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="storageGb">Storage (GB)</Label>
                                            <Input id="storageGb" type="number" value={editingItem.data.storageGb} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, storageGb: parseInt(e.target.value) || 0 } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="os">SO</Label>
                                            <Input id="os" value={editingItem.data.os} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, os: e.target.value } })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cpuModel">CPU Modelo</Label>
                                        <Input id="cpuModel" value={editingItem.data.cpuModel} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, cpuModel: e.target.value } })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="observations">Observações</Label>
                                        <Textarea id="observations" value={editingItem.data.observations} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, observations: e.target.value } })} />
                                    </div>
                                </>
                            )}

                            {editingItem.type === 'internet' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="linkType">Tipo de Link</Label>
                                        <Input id="linkType" value={editingItem.data.linkType} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, linkType: e.target.value } })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="downloadMb">Download (Mbps)</Label>
                                            <Input id="downloadMb" type="number" value={editingItem.data.downloadMb} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, downloadMb: parseInt(e.target.value) || 0 } })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="uploadMb">Upload (Mbps)</Label>
                                            <Input id="uploadMb" type="number" value={editingItem.data.uploadMb} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, uploadMb: parseInt(e.target.value) || 0 } })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="observations">Observações</Label>
                                        <Textarea id="observations" value={editingItem.data.observations} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, observations: e.target.value } })} />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingItem(null)} disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button onClick={() => editingItem && handleUpdate(editingItem.type, editingItem.data.id, editingItem.data)} disabled={isSaving}>
                            {isSaving ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppRole } from '@/types/permissions';
import { Shield, Eye, Edit, Sparkles } from 'lucide-react';

interface MenuPermissionsEditorProps {
  menuId: string;
  menuLabel: string;
  currentRolesConsulta?: AppRole[];
  currentRolesInclusaoEdicao?: AppRole[];
  currentRolesEspecial?: AppRole[];
  onSave: (menuId: string, permissions: {
    rolesConsulta: AppRole[];
    rolesInclusaoEdicao: AppRole[];
    rolesEspecial: AppRole[];
  }) => void;
  onCancel?: () => void;
}

const ALL_ROLES: AppRole[] = [
  AppRole.admin,
  AppRole.supervisao,
  AppRole.user,
  AppRole.support,
  AppRole.seller,
  AppRole.migrador,
  AppRole.implantador,
];

const ROLE_LABELS: Record<AppRole, string> = {
  [AppRole.admin]: 'Administrador',
  [AppRole.supervisao]: 'Supervisor',
  [AppRole.user]: 'Usuário',
  [AppRole.support]: 'Suporte',
  [AppRole.seller]: 'Vendedor',
  [AppRole.migrador]: 'Migrador',
  [AppRole.implantador]: 'Implantador',
};

export function MenuPermissionsEditor({
  menuId,
  menuLabel,
  currentRolesConsulta = [AppRole.admin],
  currentRolesInclusaoEdicao = [AppRole.admin],
  currentRolesEspecial = [AppRole.admin],
  onSave,
  onCancel,
}: MenuPermissionsEditorProps) {
  const [rolesConsulta, setRolesConsulta] = useState<AppRole[]>(currentRolesConsulta);
  const [rolesInclusaoEdicao, setRolesInclusaoEdicao] = useState<AppRole[]>(currentRolesInclusaoEdicao);
  const [rolesEspecial, setRolesEspecial] = useState<AppRole[]>(currentRolesEspecial);

  const toggleRole = (
    role: AppRole,
    currentRoles: AppRole[],
    setRoles: React.Dispatch<React.SetStateAction<AppRole[]>>
  ) => {
    if (currentRoles.includes(role)) {
      setRoles(currentRoles.filter((r) => r !== role));
    } else {
      setRoles([...currentRoles, role]);
    }
  };

  const handleSave = () => {
    onSave(menuId, {
      rolesConsulta,
      rolesInclusaoEdicao,
      rolesEspecial,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <CardTitle>Configurar Permissões: {menuLabel}</CardTitle>
        </div>
        <CardDescription>
          Defina quais perfis de usuário podem acessar este menu com diferentes níveis de permissão
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permissão de Consulta */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <Label className="text-base font-semibold">Consulta / Visualização</Label>
            <Badge variant="outline" className="ml-auto">
              {rolesConsulta.length} perfil(is)
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Permite visualizar dados, relatórios e listagens
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-6">
            {ALL_ROLES.map((role) => (
              <div key={`consulta-${role}`} className="flex items-center space-x-2">
                <Checkbox
                  id={`consulta-${role}`}
                  checked={rolesConsulta.includes(role)}
                  onCheckedChange={() => toggleRole(role, rolesConsulta, setRolesConsulta)}
                />
                <label
                  htmlFor={`consulta-${role}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {ROLE_LABELS[role]}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Permissão de Inclusão/Edição */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Edit className="w-4 h-4 text-green-600" />
            <Label className="text-base font-semibold">Inclusão / Edição</Label>
            <Badge variant="outline" className="ml-auto">
              {rolesInclusaoEdicao.length} perfil(is)
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Permite criar novos registros, editar e excluir dados
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-6">
            {ALL_ROLES.map((role) => (
              <div key={`inclusao-${role}`} className="flex items-center space-x-2">
                <Checkbox
                  id={`inclusao-${role}`}
                  checked={rolesInclusaoEdicao.includes(role)}
                  onCheckedChange={() => toggleRole(role, rolesInclusaoEdicao, setRolesInclusaoEdicao)}
                />
                <label
                  htmlFor={`inclusao-${role}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {ROLE_LABELS[role]}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Permissão Especial */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <Label className="text-base font-semibold">Ações Especiais</Label>
            <Badge variant="outline" className="ml-auto">
              {rolesEspecial.length} perfil(is)
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Permite ações críticas como aprovar, rejeitar, exportar, gerar relatórios especiais
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-6">
            {ALL_ROLES.map((role) => (
              <div key={`especial-${role}`} className="flex items-center space-x-2">
                <Checkbox
                  id={`especial-${role}`}
                  checked={rolesEspecial.includes(role)}
                  onCheckedChange={() => toggleRole(role, rolesEspecial, setRolesEspecial)}
                />
                <label
                  htmlFor={`especial-${role}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {ROLE_LABELS[role]}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button onClick={handleSave}>
            Salvar Permissões
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuPermissionsDto } from './dto/menu-permissions.dto';
import { PermissionType } from '../auth/decorators/permissions.decorator';

@ApiTags('menus')
@Controller('menus')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter menus permitidos para o meu perfil com permissões granulares' })
  @ApiResponse({
    status: 200,
    description: 'Lista de menus filtrada por permissão com informações de permissões granulares (canView, canEdit, canSpecial).'
  })
  findMyMenus(@Request() req: any) {
    const roles = req.user?.roles || [];
    return this.menusService.findMyMenus(roles);
  }

  @Get('check-permission')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar se usuário tem permissão específica em uma rota' })
  @ApiQuery({ name: 'route', description: 'Rota a verificar (ex: /clients)', required: true })
  @ApiQuery({
    name: 'permissionType',
    enum: PermissionType,
    description: 'Tipo de permissão (CONSULTA, INCLUSAO_EDICAO, ESPECIAL)',
    required: true
  })
  @ApiResponse({ status: 200, description: 'Retorna { hasPermission: boolean }' })
  async checkPermission(
    @Request() req: any,
    @Query('route') route: string,
    @Query('permissionType') permissionType: PermissionType,
  ) {
    const roles = req.user?.roles || [];
    const hasPermission = await this.menusService.checkRoutePermission(
      route,
      roles,
      permissionType,
    );
    return { hasPermission };
  }

  @Get()
  @Roles(AppRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os menus (Admin)' })
  findAll() {
    return this.menusService.findAll();
  }

  @Post()
  @Roles(AppRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo menu com permissões granulares (Admin)' })
  @ApiResponse({ status: 201, description: 'Menu criado com sucesso' })
  create(@Body() data: CreateMenuDto) {
    return this.menusService.create(data);
  }

  @Patch(':id')
  @Roles(AppRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar menu e suas permissões (Admin)' })
  @ApiResponse({ status: 200, description: 'Menu atualizado com sucesso' })
  update(@Param('id') id: string, @Body() data: UpdateMenuDto) {
    return this.menusService.update(id, data);
  }

  @Patch(':id/permissions')
  @Roles(AppRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar apenas as permissões granulares de um menu (Admin)' })
  @ApiResponse({ status: 200, description: 'Permissões atualizadas com sucesso' })
  updatePermissions(
    @Param('id') id: string,
    @Body() permissions: MenuPermissionsDto,
  ) {
    return this.menusService.update(id, permissions);
  }

  @Delete(':id')
  @Roles(AppRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover menu (Admin)' })
  remove(@Param('id') id: string) {
    return this.menusService.remove(id);
  }

  // Submenu endpoints
  @Get(':menuId/submenus')
  @Roles(AppRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar submenus de um menu (Admin)' })
  findSubmenus(@Param('menuId') menuId: string) {
    return this.menusService.findSubmenusByMenu(menuId);
  }

  @Post(':menuId/submenus')
  @Roles(AppRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar submenu em um menu (Admin)' })
  createSubmenu(@Param('menuId') menuId: string, @Body() data: any) {
    return this.menusService.createSubmenu(menuId, data);
  }

  @Patch('submenus/:submenuId')
  @Roles(AppRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar submenu (Admin)' })
  updateSubmenu(@Param('submenuId') submenuId: string, @Body() data: any) {
    return this.menusService.updateSubmenu(submenuId, data);
  }

  @Delete('submenus/:submenuId')
  @Roles(AppRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover submenu (Admin)' })
  deleteSubmenu(@Param('submenuId') submenuId: string) {
    return this.menusService.deleteSubmenu(submenuId);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AppRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClientCredentialsService } from './client-credentials.service';
import { CreateClientCredentialDto } from './dto/create-client-credential.dto';
import { UpdateClientCredentialMetadataDto } from './dto/update-client-credential-metadata.dto';
import { UpdateClientCredentialSecretDto } from './dto/update-client-credential-secret.dto';

@ApiTags('client-credentials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('client-credentials')
export class ClientCredentialsController {
  constructor(private readonly service: ClientCredentialsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateClientCredentialDto) {
    return this.service.create(dto, req.user?.userId);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('clientId') clientId?: string) {
    return this.service.findAll(search, clientId);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.service.findByClient(clientId);
  }

  @Patch(':id')
  updateMetadata(@Param('id') id: string, @Body() dto: UpdateClientCredentialMetadataDto) {
    return this.service.updateMetadata(id, dto);
  }

  @Patch(':id/secret')
  @Roles(AppRole.admin, AppRole.supervisao)
  updateSecret(@Param('id') id: string, @Body() dto: UpdateClientCredentialSecretDto) {
    return this.service.updateSecret(id, dto);
  }

  @Delete(':id')
  @Roles(AppRole.admin, AppRole.supervisao)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/reveal')
  @Roles(AppRole.admin, AppRole.supervisao)
  reveal(@Request() req, @Param('id') id: string) {
    return this.service.reveal(id, req.user?.userId);
  }

  @Post(':id/copy')
  copy(@Request() req, @Param('id') id: string) {
    return this.service.copy(id, req.user?.userId);
  }
}

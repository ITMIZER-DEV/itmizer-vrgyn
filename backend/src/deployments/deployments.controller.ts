import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { DeploymentsService } from './deployments.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { UpdateDeploymentDto } from './dto/update-deployment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('deployments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Post()
  create(@Request() req, @Body() createDeploymentDto: CreateDeploymentDto) {
    return this.deploymentsService.create(createDeploymentDto, req.user?.userId);
  }

  @Get()
  findAll() {
    return this.deploymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deploymentsService.findOne(id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateDeploymentDto: UpdateDeploymentDto) {
    return this.deploymentsService.update(id, updateDeploymentDto, req.user?.userId);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.deploymentsService.remove(id, req.user?.userId);
  }

  @Post(':id/history')
  addHistory(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { action: string; details?: string }
  ) {
    return this.deploymentsService.addHistory(id, body, req.user?.userId);
  }
}

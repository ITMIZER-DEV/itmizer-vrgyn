import { Controller, Get } from '@nestjs/common';
import { AppService, AppVersionResponse } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Mensagem de boas-vindas da API' })
  @ApiResponse({ status: 200, description: 'Retorna status online da API.' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('version')
  @ApiOperation({ summary: 'Retorna a versão e build atuais do sistema' })
  @ApiResponse({ status: 200, description: 'Metadados de versão SemVer.' })
  getVersion(): AppVersionResponse {
    return this.appService.getVersion();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check do serviço' })
  @ApiResponse({ status: 200, description: 'Status de saúde do backend.' })
  getHealth() {
    return this.appService.getHealth();
  }
}


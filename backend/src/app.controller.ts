import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Hello World root endpoint' })
  @ApiResponse({ status: 200, description: 'Returns a greeting message.' })
  getHello(): string {
    return this.appService.getHello();
  }
}

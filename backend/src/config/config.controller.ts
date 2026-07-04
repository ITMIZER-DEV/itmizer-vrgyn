import { Controller, Get } from '@nestjs/common';
import { ConfigService } from './config.service';

@Controller('config')
export class ConfigController {
    constructor(private readonly configService: ConfigService) { }

    @Get('requirements')
    getRequirements() {
        return this.configService.getRequirements();
    }

    @Get('peripherals')
    getPeripherals() {
        return this.configService.getPeripherals();
    }
}

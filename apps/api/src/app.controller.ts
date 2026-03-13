import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './modules/auth/decorators/public.decorator';

/**
 * Controller raiz - usado para health check e informações básicas da API.
 * Em produção, pode servir para monitoramento e status do sistema.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): { message: string; version: string } {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  health(): { status: string; timestamp: string } {
    return this.appService.health();
  }

  @Public()
  @Get('health/db')
  async healthDb() {
    return this.appService.healthDb();
  }
}

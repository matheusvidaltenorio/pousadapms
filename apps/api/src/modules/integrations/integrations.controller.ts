import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  async findByProperty(@Query('propertyId') propertyId: string) {
    if (!propertyId) return [];
    return this.integrationsService.findByProperty(propertyId);
  }

  @Post()
  async create(@Body() body: CreateIntegrationDto & { propertyId: string }) {
    return this.integrationsService.create(body.propertyId, {
      channel: body.channel,
      icalUrl: body.icalUrl,
      roomId: body.roomId,
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: { channel?: string; icalUrl?: string; roomId?: string; isActive?: boolean },
  ) {
    return this.integrationsService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.integrationsService.delete(id);
  }

  @Post(':id/sync')
  async sync(@Param('id') id: string) {
    return this.integrationsService.sync(id);
  }

  @Post('sync-all')
  async syncAll(@Body() body: { propertyId: string }) {
    return this.integrationsService.syncAll(body.propertyId);
  }
}

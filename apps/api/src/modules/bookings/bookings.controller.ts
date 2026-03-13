import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  async findMany(
    @Query('propertyId') propertyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    if (!propertyId) return [];
    return this.bookingsService.findMany(propertyId, { startDate, endDate, status });
  }

  @Get('available-rooms')
  async getAvailableRooms(
    @Query('propertyId') propertyId: string,
    @Query('checkinDate') checkinDate: string,
    @Query('checkoutDate') checkoutDate: string,
  ) {
    return this.bookingsService.getAvailableRooms(propertyId, checkinDate, checkoutDate);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.bookingsService.create(data);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.bookingsService.cancel(id, body.reason);
  }

  @Post(':id/check-in')
  async checkIn(@Param('id') id: string) {
    return this.bookingsService.checkIn(id);
  }

  @Post(':id/check-out')
  async checkOut(@Param('id') id: string) {
    return this.bookingsService.checkOut(id);
  }
}

import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentMethod } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async findMany(
    @Query('propertyId') propertyId: string,
    @Query('bookingId') bookingId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!propertyId) return [];
    return this.paymentsService.findByProperty(propertyId, {
      bookingId,
      startDate,
      endDate,
    });
  }

  @Get('booking/:bookingId')
  async findByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.findByBooking(bookingId);
  }

  @Post()
  async create(
    @Body()
    data: {
      propertyId: string;
      bookingId: string;
      amount: number;
      paymentMethod: PaymentMethod;
      paymentDate: string;
      reference?: string;
      notes?: string;
    },
  ) {
    return this.paymentsService.create(data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.paymentsService.delete(id);
  }
}

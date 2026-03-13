import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@Query('propertyId') propertyId: string) {
    if (!propertyId) return { totalRooms: 0, occupiedToday: 0, occupancyRate: 0, checkinsToday: 0, checkoutsToday: 0, revenueToday: 0 };
    return this.dashboardService.getStats(propertyId);
  }

  @Get('cash-closure')
  async getCashClosure(
    @Query('propertyId') propertyId: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!propertyId) {
      const empty = { totalReceipts: 0, totalExpenses: 0, balance: 0, payments: [], expenses: [] };
      return startDate && endDate
        ? { ...empty, startDate, endDate }
        : { ...empty, date: date || new Date().toISOString().slice(0, 10) };
    }
    if (startDate && endDate) {
      return this.dashboardService.getCashClosureRange(propertyId, startDate, endDate);
    }
    const d = date || new Date().toISOString().slice(0, 10);
    return this.dashboardService.getCashClosure(propertyId, d);
  }
}

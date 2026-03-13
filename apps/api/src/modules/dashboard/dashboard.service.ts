import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(propertyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [rooms, checkinsToday, checkoutsToday, totalBookings, revenueToday] = await Promise.all([
      this.prisma.room.count({ where: { propertyId, deletedAt: null, isActive: true } }),
      this.prisma.booking.count({
        where: {
          propertyId,
          deletedAt: null,
          status: 'confirmed',
          checkinDate: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.booking.count({
        where: {
          propertyId,
          deletedAt: null,
          status: 'checked_in',
          checkoutDate: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.booking.count({
        where: {
          propertyId,
          deletedAt: null,
          status: { in: ['confirmed', 'checked_in'] },
          checkinDate: { lte: today },
          checkoutDate: { gt: today },
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          propertyId,
          deletedAt: null,
          status: 'completed',
          paymentDate: { gte: today, lt: tomorrow },
        },
        _sum: { amount: true },
      }),
    ]);

    const occupied = totalBookings;
    const occupancyRate = rooms > 0 ? Math.round((occupied / rooms) * 100) : 0;

    return {
      totalRooms: rooms,
      occupiedToday: occupied,
      occupancyRate,
      checkinsToday,
      checkoutsToday,
      revenueToday: Number(revenueToday._sum.amount ?? 0),
    };
  }

  /**
   * Fechamento de caixa - receitas (pagamentos) e despesas de um dia.
   */
  async getCashClosure(propertyId: string, date: string) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);

    const [paymentsSum, expensesSum, payments, expenses] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          propertyId,
          deletedAt: null,
          status: 'completed',
          paymentDate: { gte: d, lt: nextDay },
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          propertyId,
          deletedAt: null,
          expenseDate: { gte: d, lt: nextDay },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.findMany({
        where: {
          propertyId,
          deletedAt: null,
          status: 'completed',
          paymentDate: { gte: d, lt: nextDay },
        },
        include: { booking: { include: { guest: true } } },
        orderBy: { paymentDate: 'asc' },
      }),
      this.prisma.expense.findMany({
        where: {
          propertyId,
          deletedAt: null,
          expenseDate: { gte: d, lt: nextDay },
        },
        orderBy: { expenseDate: 'asc' },
      }),
    ]);

    const totalReceipts = Number(paymentsSum._sum.amount ?? 0);
    const totalExpenses = Number(expensesSum._sum.amount ?? 0);
    const balance = totalReceipts - totalExpenses;

    return {
      date,
      totalReceipts,
      totalExpenses,
      balance,
      payments,
      expenses,
    };
  }

  /**
   * Fechamento de caixa por período - receitas e despesas entre startDate e endDate.
   */
  async getCashClosureRange(
    propertyId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [rangeStart, rangeEnd] = end < start ? [end, start] : [start, end];

    const [paymentsSum, expensesSum, payments, expenses] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          propertyId,
          deletedAt: null,
          status: 'completed',
          paymentDate: { gte: rangeStart, lte: rangeEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          propertyId,
          deletedAt: null,
          expenseDate: { gte: rangeStart, lte: rangeEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.findMany({
        where: {
          propertyId,
          deletedAt: null,
          status: 'completed',
          paymentDate: { gte: rangeStart, lte: rangeEnd },
        },
        include: { booking: { include: { guest: true } } },
        orderBy: { paymentDate: 'asc' },
      }),
      this.prisma.expense.findMany({
        where: {
          propertyId,
          deletedAt: null,
          expenseDate: { gte: rangeStart, lte: rangeEnd },
        },
        orderBy: { expenseDate: 'asc' },
      }),
    ]);

    const totalReceipts = Number(paymentsSum._sum.amount ?? 0);
    const totalExpenses = Number(expensesSum._sum.amount ?? 0);
    const balance = totalReceipts - totalExpenses;

    return {
      startDate,
      endDate,
      totalReceipts,
      totalExpenses,
      balance,
      payments,
      expenses,
    };
  }
}

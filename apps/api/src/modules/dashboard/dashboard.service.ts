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
   * Overview do dashboard: reservas hoje, status quartos, avisos, ocupação 7 dias.
   */
  async getOverview(propertyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayReservations, roomStatusCounts, pendingPayments, roomsCleaning, property, occupancyByDay] =
      await Promise.all([
        this.getTodayReservations(propertyId, today, tomorrow),
        this.getRoomStatusCounts(propertyId),
        this.getPendingPaymentAlerts(propertyId),
        this.getRoomsCleaningAlerts(propertyId),
        this.prisma.property.findUnique({
          where: { id: propertyId },
          select: { checkinTime: true },
        }),
        this.getOccupancyLast7Days(propertyId),
      ]);

    const alerts = this.buildAlerts(
      todayReservations,
      pendingPayments,
      roomsCleaning,
      property?.checkinTime ?? '14:00',
    );

    return {
      todayReservations,
      roomStatus: roomStatusCounts,
      alerts,
      occupancyWeek: occupancyByDay,
    };
  }

  private async getTodayReservations(
    propertyId: string,
    today: Date,
    tomorrow: Date,
  ) {
    const checkins = await this.prisma.booking.findMany({
      where: {
        propertyId,
        deletedAt: null,
        status: 'confirmed',
        checkinDate: { gte: today, lt: tomorrow },
      },
      include: { guest: true, room: true },
      orderBy: { checkinDate: 'asc' },
    });
    const checkouts = await this.prisma.booking.findMany({
      where: {
        propertyId,
        deletedAt: null,
        status: 'checked_in',
        checkoutDate: { gte: today, lt: tomorrow },
      },
      include: { guest: true, room: true },
      orderBy: { checkoutDate: 'asc' },
    });

    const items: { guestName: string; roomNumber: string; type: 'check-in' | 'check-out' }[] = [];
    for (const b of checkins) {
      items.push({
        guestName: b.guest.name,
        roomNumber: b.room.number,
        type: 'check-in',
      });
    }
    for (const b of checkouts) {
      items.push({
        guestName: b.guest.name,
        roomNumber: b.room.number,
        type: 'check-out',
      });
    }
    return items;
  }

  private async getRoomStatusCounts(propertyId: string) {
    const [available, occupied, cleaning, maintenance, blocked] = await Promise.all([
      this.prisma.room.count({
        where: { propertyId, deletedAt: null, isActive: true, status: 'available' },
      }),
      this.prisma.room.count({
        where: { propertyId, deletedAt: null, isActive: true, status: 'occupied' },
      }),
      this.prisma.room.count({
        where: { propertyId, deletedAt: null, isActive: true, status: 'cleaning' },
      }),
      this.prisma.room.count({
        where: { propertyId, deletedAt: null, isActive: true, status: 'maintenance' },
      }),
      this.prisma.room.count({
        where: { propertyId, deletedAt: null, isActive: true, status: 'blocked' },
      }),
    ]);
    return { available, occupied, cleaning, maintenance, blocked };
  }

  private async getPendingPaymentAlerts(propertyId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        propertyId,
        deletedAt: null,
        status: { in: ['confirmed', 'checked_in'] },
      },
      select: { id: true, totalAmount: true, paidAmount: true, room: { select: { number: true } } },
    });
    return bookings
      .filter((b) => Number(b.totalAmount) > Number(b.paidAmount))
      .slice(0, 10)
      .map((b) => ({
        bookingId: b.id,
        roomNumber: b.room.number,
        shortId: b.id.slice(0, 8),
      }));
  }

  private async getRoomsCleaningAlerts(propertyId: string) {
    const rooms = await this.prisma.room.findMany({
      where: {
        propertyId,
        deletedAt: null,
        isActive: true,
        status: 'cleaning',
      },
      select: { number: true },
    });
    return rooms.map((r) => r.number);
  }

  private buildAlerts(
    todayReservations: { guestName: string; roomNumber: string; type: 'check-in' | 'check-out' }[],
    pendingPayments: { bookingId: string; roomNumber: string; shortId: string }[],
    roomsCleaning: string[],
    checkinTime: string,
  ) {
    const alerts: string[] = [];
    const [h, m] = checkinTime.split(':').map(Number);
    const now = new Date();
    const checkinToday = new Date(now);
    checkinToday.setHours(h, m, 0, 0);
    const diffMs = checkinToday.getTime() - now.getTime();
    const diffHours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));

    const checkinRooms = todayReservations.filter((r) => r.type === 'check-in').map((r) => r.roomNumber);
    for (const room of checkinRooms) {
      alerts.push(`Check-in ${diffHours === 0 ? 'agora' : `em ${diffHours} hora${diffHours > 1 ? 's' : ''}`} — Quarto ${room}`);
    }
    for (const p of pendingPayments) {
      alerts.push(`Pagamento pendente — Reserva #${p.shortId}`);
    }
    for (const room of roomsCleaning) {
      alerts.push(`Quarto ${room} precisa de limpeza`);
    }
    return alerts;
  }

  private async getOccupancyLast7Days(propertyId: string) {
    const totalRooms = await this.prisma.room.count({
      where: { propertyId, deletedAt: null, isActive: true },
    });
    if (totalRooms === 0) {
      return [
        { day: 'Dom', label: 'Dom', rate: 0 },
        { day: 'Seg', label: 'Seg', rate: 0 },
        { day: 'Ter', label: 'Ter', rate: 0 },
        { day: 'Qua', label: 'Qua', rate: 0 },
        { day: 'Qui', label: 'Qui', rate: 0 },
        { day: 'Sex', label: 'Sex', rate: 0 },
        { day: 'Sab', label: 'Sab', rate: 0 },
      ];
    }

    const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const result: { day: string; label: string; rate: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const occupied = await this.prisma.booking.count({
        where: {
          propertyId,
          deletedAt: null,
          status: { in: ['confirmed', 'checked_in'] },
          checkinDate: { lte: d },
          checkoutDate: { gt: d },
        },
      });
      const rate = Math.round((occupied / totalRooms) * 100);
      const dayIdx = d.getDay();
      result.push({
        day: dayLabels[dayIdx],
        label: dayLabels[dayIdx],
        rate,
      });
    }
    return result;
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

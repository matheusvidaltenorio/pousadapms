import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { BookingStatus } from '@prisma/client';

const ACTIVE_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'checked_in'];

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(propertyId: string, params?: { startDate?: string; endDate?: string; status?: string }) {
    const where: any = { propertyId, deletedAt: null };
    if (params?.startDate && params?.endDate) {
      where.OR = [
        {
          checkinDate: { lte: new Date(params.endDate) },
          checkoutDate: { gte: new Date(params.startDate) },
        },
      ];
    }
    if (params?.status) {
      where.status = params.status;
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        room: { include: { roomType: true } },
        guest: true,
      },
      orderBy: { checkinDate: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.booking.findFirst({
      where: { id, deletedAt: null },
      include: {
        room: { include: { roomType: true } },
        guest: true,
        payments: true,
      },
    });
  }

  async getAvailableRooms(propertyId: string, checkinDate: string, checkoutDate: string) {
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);
    if (checkout <= checkin) {
      throw new BadRequestException('Data de check-out deve ser posterior ao check-in');
    }

    const overlapping = await this.prisma.booking.findMany({
      where: {
        propertyId,
        status: { in: ACTIVE_STATUSES },
        OR: [
          {
            checkinDate: { lt: checkout },
            checkoutDate: { gt: checkin },
          },
        ],
      },
      select: { roomId: true },
    });
    const busyRoomIds = overlapping.map((b) => b.roomId);

    return this.prisma.room.findMany({
      where: {
        propertyId,
        deletedAt: null,
        isActive: true,
        status: 'available',
        id: { notIn: busyRoomIds },
      },
      include: { roomType: true },
      orderBy: { number: 'asc' },
    });
  }

  async create(data: {
    propertyId: string;
    roomId: string;
    guestId: string;
    checkinDate: string;
    checkoutDate: string;
    adults?: number;
    children?: number;
    totalAmount: number;
    notes?: string;
  }) {
    const checkin = new Date(data.checkinDate);
    const checkout = new Date(data.checkoutDate);

    const existing = await this.prisma.booking.findFirst({
      where: {
        roomId: data.roomId,
        status: { in: ACTIVE_STATUSES },
        checkinDate: { lt: checkout },
        checkoutDate: { gt: checkin },
      },
    });
    if (existing) {
      throw new ConflictException('Quarto já reservado neste período');
    }

    return this.prisma.booking.create({
      data: {
        propertyId: data.propertyId,
        roomId: data.roomId,
        guestId: data.guestId,
        checkinDate: checkin,
        checkoutDate: checkout,
        adults: data.adults ?? 2,
        children: data.children ?? 0,
        totalAmount: data.totalAmount,
        notes: data.notes,
        status: 'confirmed',
        source: 'direct',
      },
      include: {
        room: { include: { roomType: true } },
        guest: true,
      },
    });
  }

  async cancel(id: string, reason?: string) {
    return this.prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
    });
  }

  async checkIn(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: { room: true } });
    if (!booking) throw new BadRequestException('Reserva não encontrada');
    if (booking.status !== 'confirmed') throw new BadRequestException('Reserva não está confirmada');

    return this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id },
        data: { status: 'checked_in', checkedInAt: new Date() },
      }),
      this.prisma.room.update({
        where: { id: booking.roomId },
        data: { status: 'occupied' },
      }),
    ]).then(([b]) => b);
  }

  async checkOut(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: { room: true } });
    if (!booking) throw new BadRequestException('Reserva não encontrada');
    if (booking.status !== 'checked_in') throw new BadRequestException('Reserva não está em estadia');

    return this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id },
        data: { status: 'checked_out', checkedOutAt: new Date() },
      }),
      this.prisma.room.update({
        where: { id: booking.roomId },
        data: { status: 'cleaning' },
      }),
    ]).then(([b]) => b);
  }
}

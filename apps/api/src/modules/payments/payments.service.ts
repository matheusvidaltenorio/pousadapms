import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { PaymentMethod } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByBooking(bookingId: string) {
    return this.prisma.payment.findMany({
      where: { bookingId, deletedAt: null },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findByProperty(
    propertyId: string,
    params?: { startDate?: string; endDate?: string; bookingId?: string },
  ) {
    const where: Record<string, unknown> = { propertyId, deletedAt: null };
    if (params?.bookingId) where.bookingId = params.bookingId;
    if (params?.startDate && params?.endDate) {
      where.paymentDate = {
        gte: new Date(params.startDate),
        lte: new Date(params.endDate),
      };
    }

    return this.prisma.payment.findMany({
      where,
      include: { booking: { include: { guest: true } } },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async create(data: {
    propertyId: string;
    bookingId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    reference?: string;
    notes?: string;
  }) {
    if (data.amount <= 0) {
      throw new BadRequestException('Valor deve ser maior que zero');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          propertyId: data.propertyId,
          bookingId: data.bookingId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          paymentDate: new Date(data.paymentDate),
          reference: data.reference,
          notes: data.notes,
          status: 'completed',
        },
      });

      const paymentsSum = await tx.payment.aggregate({
        where: { bookingId: data.bookingId, status: 'completed', deletedAt: null },
        _sum: { amount: true },
      });
      const paidAmount = Number(paymentsSum._sum.amount ?? 0);

      await tx.booking.update({
        where: { id: data.bookingId },
        data: { paidAmount },
      });

      return payment;
    });

    return this.prisma.payment.findUnique({
      where: { id: result.id },
      include: { booking: { include: { guest: true } } },
    });
  }

  async delete(id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
    });
    if (!payment) throw new BadRequestException('Pagamento não encontrado');

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      if (payment.bookingId) {
        const paymentsSum = await tx.payment.aggregate({
          where: {
            bookingId: payment.bookingId,
            status: 'completed',
            deletedAt: null,
          },
          _sum: { amount: true },
        });
        const paidAmount = Number(paymentsSum._sum.amount ?? 0);
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { paidAmount },
        });
      }
    });

    return { success: true };
  }
}

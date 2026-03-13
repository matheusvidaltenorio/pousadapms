import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { BookingSource } from '@prisma/client';
import * as ical from 'node-ical';

const OTA_GUEST_NAME = 'Hóspede OTA';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ICalEvent = any;

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProperty(propertyId: string) {
    return this.prisma.integration.findMany({
      where: { propertyId },
      include: {
        room: { include: { roomType: true } },
        syncLogs: { take: 5, orderBy: { startedAt: 'desc' } },
      },
      orderBy: { channel: 'asc' },
    });
  }

  async create(propertyId: string, data: { channel: string; icalUrl: string; roomId: string }) {
    const room = await this.prisma.room.findFirst({
      where: { id: data.roomId, propertyId },
    });
    if (!room) throw new BadRequestException('Quarto não encontrado');

    return this.prisma.integration.create({
      data: {
        propertyId,
        channel: data.channel,
        icalUrl: data.icalUrl,
        roomId: data.roomId,
      },
      include: {
        room: { include: { roomType: true } },
      },
    });
  }

  async update(id: string, data: { channel?: string; icalUrl?: string; roomId?: string; isActive?: boolean }) {
    return this.prisma.integration.update({
      where: { id },
      data: {
        ...(data.channel && { channel: data.channel }),
        ...(data.icalUrl && { icalUrl: data.icalUrl }),
        ...(data.roomId && { roomId: data.roomId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        room: { include: { roomType: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.integration.delete({ where: { id } });
  }

  async sync(integrationId: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { id: integrationId },
      include: { room: true },
    });
    if (!integration) throw new BadRequestException('Integração não encontrada');
    if (!integration.isActive) throw new BadRequestException('Integração está inativa');

    const log = await this.prisma.syncLog.create({
      data: {
        integrationId,
        startedAt: new Date(),
        status: 'running',
      },
    });

    let bookingsCreated = 0;
    let bookingsUpdated = 0;
    let bookingsCancelled = 0;
    let errorMessage: string | null = null;

    try {
      const data = await ical.async.fromURL(integration.icalUrl);
      const events = Object.values(data).filter((e): e is ICalEvent => 
        typeof e === 'object' && e !== null && (e as ICalEvent).type === 'VEVENT'
      );

      const source = integration.channel === 'airbnb' ? 'airbnb' : 'booking';
      const guest = await this.getOrCreateOtaGuest(integration.propertyId);

      for (const event of events) {
        const uid = event.uid || event.summary?.toString?.() || '';
        if (!uid) continue;

        const isCancelled = event.status?.toUpperCase() === 'CANCELLED';
        const startDate = this.toDate(event.start);
        const endDate = this.toDate(event.end);
        if (!startDate || !endDate) continue;

        const summary = typeof event.summary === 'string' 
          ? event.summary 
          : (event.summary as { val?: string })?.val || OTA_GUEST_NAME;

        const existing = await this.prisma.booking.findFirst({
          where: {
            propertyId: integration.propertyId,
            externalBookingId: uid,
            externalChannel: integration.channel,
          },
        });

        if (existing) {
          if (isCancelled && existing.status !== 'cancelled') {
            await this.prisma.booking.update({
              where: { id: existing.id },
              data: {
                status: 'cancelled',
                cancellationReason: 'Cancelado via calendário OTA',
                cancelledAt: new Date(),
              },
            });
            bookingsCancelled++;
          }
          continue;
        }

        if (isCancelled) continue;

        const overlap = await this.prisma.booking.findFirst({
          where: {
            roomId: integration.roomId,
            status: { in: ['pending', 'confirmed', 'checked_in'] },
            checkinDate: { lt: endDate },
            checkoutDate: { gt: startDate },
          },
        });
        if (overlap) continue;

        await this.prisma.booking.create({
          data: {
            propertyId: integration.propertyId,
            roomId: integration.roomId,
            guestId: guest.id,
            checkinDate: startDate,
            checkoutDate: endDate,
            adults: 2,
            children: 0,
            totalAmount: 0,
            status: 'confirmed',
            source,
            externalBookingId: uid,
            externalChannel: integration.channel,
            notes: summary !== OTA_GUEST_NAME ? `OTA: ${summary}` : undefined,
          },
        });
        bookingsCreated++;
      }

      await this.prisma.integration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'success',
          lastSyncError: null,
        },
      });

      await this.prisma.syncLog.update({
        where: { id: log.id },
        data: {
          finishedAt: new Date(),
          status: 'success',
          bookingsCreated,
          bookingsUpdated,
          bookingsCancelled,
        },
      });

      return {
        status: 'success',
        bookingsCreated,
        bookingsUpdated,
        bookingsCancelled,
      };
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      await this.prisma.integration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'failed',
          lastSyncError: errorMessage,
        },
      });
      await this.prisma.syncLog.update({
        where: { id: log.id },
        data: {
          finishedAt: new Date(),
          status: 'failed',
          errorMessage,
          bookingsCreated,
          bookingsUpdated,
          bookingsCancelled,
        },
      });
      throw new BadRequestException(`Erro ao sincronizar: ${errorMessage}`);
    }
  }

  async syncAll(propertyId: string) {
    const integrations = await this.prisma.integration.findMany({
      where: { propertyId, isActive: true },
    });
    const results: { integrationId: string; status: string; error?: string }[] = [];
    for (const i of integrations) {
      try {
        await this.sync(i.id);
        results.push({ integrationId: i.id, status: 'success' });
      } catch (e) {
        results.push({
          integrationId: i.id,
          status: 'failed',
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
    return results;
  }

  private async getOrCreateOtaGuest(propertyId: string) {
    let guest = await this.prisma.guest.findFirst({
      where: { propertyId, name: OTA_GUEST_NAME },
    });
    if (!guest) {
      guest = await this.prisma.guest.create({
        data: {
          propertyId,
          name: OTA_GUEST_NAME,
          email: 'ota@pousada.local',
        },
      });
    }
    return guest;
  }

  private toDate(val: Date | { toISOString?: () => string } | undefined): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof (val as { toISOString?: () => string }).toISOString === 'function') {
      return new Date((val as { toISOString: () => string }).toISOString());
    }
    return null;
  }
}

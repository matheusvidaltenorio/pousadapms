import { Injectable } from '@nestjs/common';
import { PrismaService } from './shared/database/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): { message: string; version: string } {
    return {
      message: 'Pousada PMS API',
      version: '0.1.0',
    };
  }

  health(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verifica conexão com PostgreSQL e retorna informações das tabelas.
   * Útil para diagnóstico: GET /health/db
   */
  async healthDb(): Promise<{
    status: 'ok' | 'error';
    timestamp: string;
    database: string;
    connected: boolean;
    tables?: string[];
    error?: string;
  }> {
    const result: {
      status: 'ok' | 'error';
      timestamp: string;
      database: string;
      connected: boolean;
      tables?: string[];
      error?: string;
    } = {
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'unknown',
      connected: false,
    };

    try {
      const tables = await this.prisma.$queryRaw<{ tablename: string }[]>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
      `;
      result.status = 'ok';
      result.connected = true;
      result.database = process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] ?? 'unknown';
      result.tables = tables.map((t) => t.tablename);
    } catch (e) {
      result.error = (e as Error).message;
    }
    return result;
  }
}

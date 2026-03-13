import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Serviço que encapsula o cliente Prisma.
 *
 * OnModuleInit: conecta ao banco quando a aplicação inicia
 * OnModuleDestroy: desconecta corretamente ao encerrar (importante para evitar vazamento de conexões)
 *
 * Em testes, pode ser útil usar $disconnect() manualmente.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

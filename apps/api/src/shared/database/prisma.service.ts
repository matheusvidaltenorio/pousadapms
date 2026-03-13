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
    // Conexão lazy: evita crash na inicialização se o banco estiver inacessível
    // Prisma conecta automaticamente na primeira query
    try {
      await this.$connect();
    } catch (err) {
      console.error('⚠️ Prisma: falha ao conectar ao banco. Verifique DATABASE_URL.', err);
      // Não propaga o erro - app inicia para permitir health check e logs
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

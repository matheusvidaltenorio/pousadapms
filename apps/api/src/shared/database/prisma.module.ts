import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Módulo global que disponibiliza o PrismaService.
 *
 * Global: não precisa importar em cada módulo - fica disponível em toda a aplicação.
 * PrismaService: singleton que gerencia a conexão com o PostgreSQL.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

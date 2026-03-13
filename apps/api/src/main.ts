import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Ponto de entrada da aplicação backend.
 *
 * NestFactory cria uma instância da aplicação NestJS.
 * ValidationPipe global garante que todos os DTOs sejam validados automaticamente.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita validação automática de DTOs (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove campos não definidos no DTO
      forbidNonWhitelisted: true, // Rejeita request com campos extras
      transform: true, // Converte tipos (string -> number, etc.)
    }),
  );

  // Prefixo global para todas as rotas da API
  app.setGlobalPrefix('api');

  // CORS: permite requisições do frontend (ajustar em produção)
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 API rodando em http://localhost:${port}/api`);
}

bootstrap().catch(console.error);

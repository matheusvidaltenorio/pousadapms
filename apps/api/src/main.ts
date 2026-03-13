import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';

/**
 * Ponto de entrada da aplicação backend.
 *
 * NestFactory cria uma instância da aplicação NestJS.
 * ValidationPipe global garante que todos os DTOs sejam validados automaticamente.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());

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

  // CORS: permite requisições do frontend
  // CORS_ORIGIN (única) ou CORS_ORIGINS (várias, separadas por vírgula)
  const corsOrigin = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS;
  const origins = corsOrigin
    ? corsOrigin.split(',').map((o) => o.trim()).filter(Boolean)
    : ['http://localhost:5173'];
  app.enableCors({
    origin: origins.length === 1 ? origins[0] : origins,
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 API rodando em http://localhost:${port}/api`);
}

bootstrap().catch(console.error);

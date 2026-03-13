import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtro global de exceções.
 * - Loga o erro completo no servidor (útil para debug no Render)
 * - Retorna mensagens amigáveis para erros conhecidos (Prisma)
 * - Mantém status e mensagem para HttpException
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as { message?: string }).message ?? String(res);
    } else if (exception && typeof exception === 'object' && 'code' in exception) {
      // Erros do Prisma
      const prismaError = exception as { code?: string; meta?: { target?: string[] } };
      this.logger.error(`Prisma: ${JSON.stringify(prismaError)}`);
      if (prismaError.code === 'P1000' || prismaError.code === 'P1001') {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Falha ao conectar ao banco de dados. Verifique DATABASE_URL.';
      } else if (prismaError.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        const target = prismaError.meta?.target?.[0] ?? 'campo';
        message = `Já existe um registro com este ${target}.`;
      } else if (prismaError.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Registro não encontrado.';
      } else {
        message = `Erro no banco: ${prismaError.code}. Verifique os logs.`;
      }
    } else {
      this.logger.error(`${request.method} ${request.url} - 500:`, exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
    });
  }
}

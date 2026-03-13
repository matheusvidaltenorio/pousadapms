import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO para o endpoint de login.
 * Usa class-validator para validar automaticamente o body da requisição.
 */
export class LoginDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;
}

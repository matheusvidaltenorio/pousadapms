import { Controller, Post, Body } from '@nestjs/common';
import { AuthService, LoginInput } from './auth.service';
import { Public } from './decorators/public.decorator';

/**
 * Controller de autenticação.
 * POST /auth/login - recebe email e senha, retorna JWT e dados do usuário.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: LoginInput) {
    return this.authService.login({
      email: body.email,
      password: body.password,
    });
  }
}

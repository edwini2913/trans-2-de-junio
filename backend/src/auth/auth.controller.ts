import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import {
  AuthService,
} from './auth.service';

import {
  LoginDto,
} from './dto/login.dto';

import {
  RegisterDto,
} from './dto/register.dto';

import {
  RestablecerPasswordDto,
} from './dto/restablecer-password.dto';

import {
  SolicitarRecuperacionDto,
} from './dto/solicitar-recuperacion.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService:
      AuthService,
  ) {}

  @Post('register')
  register(
    @Body()
    registerDto: RegisterDto,
  ) {
    return this.authService.register(
      registerDto,
    );
  }

  @Post('login')
  login(
    @Body()
    loginDto: LoginDto,
  ) {
    return this.authService.login(
      loginDto,
    );
  }

  /*
   * Recibe el correo y envía el enlace
   * de recuperación si la cuenta existe.
   */
  @Post('recuperar-password')
  recuperarPassword(
    @Body()
    dto: SolicitarRecuperacionDto,
  ) {
    return this.authService.solicitarRecuperacionPassword(
      dto,
    );
  }

  /*
   * Recibe el token y la nueva contraseña.
   */
  @Post('restablecer-password')
  restablecerPassword(
    @Body()
    dto: RestablecerPasswordDto,
  ) {
    return this.authService.restablecerPassword(
      dto,
    );
  }
}
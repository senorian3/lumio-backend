import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { registrationInputDto } from '../input-dto/registration.input-dto';
import { CommandBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../../application/use-cases/register-user.usecase';
import { loginInputDto } from '../input-dto/login.input-dto';
import { Response, Request } from 'express';
import { LoginUserCommand } from '../../application/use-cases/login-user.usecase';
import { RefreshTokenGuard } from 'apps/lumio/src/core/guards/refresh/refresh-token.guard';
import { LogoutUserCommand } from '../../application/use-cases/logout-user.usecase';

@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}
  @Post('registration')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(@Body() dto: registrationInputDto) {
    await this.commandBus.execute<RegisterUserCommand, void>(
      new RegisterUserCommand(dto),
    );
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: loginInputDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const ip: string =
      req.socket.remoteAddress ||
      (Array.isArray(req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'][0]
        : req.headers['x-forwarded-for']) ||
      'unknown';

    const userAgent = req.headers['user-agent'] || 'unknown';

    const { accessToken, refreshToken } = await this.commandBus.execute<
      LoginUserCommand,
      { accessToken: string; refreshToken: string }
    >(new LoginUserCommand(dto, userAgent!, ip));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }

  @UseGuards(RefreshTokenGuard)
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: any): Promise<void> {
    return await this.commandBus.execute(
      new LogoutUserCommand(req.user.userId, req.user.deviceId),
    );
  }
}

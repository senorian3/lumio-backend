import {
  Body,
  Controller,
  Get,
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
import { PasswordRecoveryCommand } from '../../application/use-cases/password-recovery.usecase';
import { PasswordRecoveryInputDto } from '../input-dto/password-recovery.input-dto';
import { NewPasswordInputDto } from '../input-dto/new-password.input-dto1';
import { NewPasswordCommand } from '../../application/use-cases/new-password.usecase';
import { AuthGuard } from '@nestjs/passport';
import { LoginUserGitHubCommand } from '../../application/use-cases/login-user-github.usecase';

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

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ThrottlerGuard)
  async passwordRecovery(@Body() dto: PasswordRecoveryInputDto) {
    await this.commandBus.execute<PasswordRecoveryCommand, void>(
      new PasswordRecoveryCommand(dto),
    );
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ThrottlerGuard)
  async newPassword(@Body() dto: NewPasswordInputDto) {
    await this.commandBus.execute<NewPasswordCommand, void>(
      new NewPasswordCommand(dto),
    );
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // Guard сам сделает 302 на GitHub, код не нужен
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req, @Res() res: Response) {
    const ip: string =
      req.socket.remoteAddress ||
      (Array.isArray(req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'][0]
        : req.headers['x-forwarded-for']) ||
      'unknown';
    const deviceName = req.headers['user-agent'] || 'unknown';
    const user = req.user;

    const { accessToken, refreshToken } = await this.commandBus.execute<
      LoginUserGitHubCommand,
      { accessToken: string; refreshToken: string }
    >(new LoginUserGitHubCommand(user, deviceName, ip));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    //res.json({ accessToken });   ----- это прирвать запрос для теста сработал поинт или нет
    return { accessToken };
  }
}

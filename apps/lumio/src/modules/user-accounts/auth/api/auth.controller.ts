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
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { CommandBus } from '@nestjs/cqrs';
import { Response, Request } from 'express';
import { RefreshTokenGuard } from '@lumio/core/guards/refresh/refresh-token.guard';
import { AuthGuard } from '@nestjs/passport';
import { LoginUserGitHubCommand } from '../application/use-cases/login-user-github.usecase';
import { LoginUserCommand } from '../application/use-cases/login-user.usecase';
import { LogoutUserCommand } from '../application/use-cases/logout-user.usecase';
import { NewPasswordCommand } from '../application/use-cases/new-password.usecase';
import { PasswordRecoveryCommand } from '../application/use-cases/password-recovery.usecase';
import { RegisterUserCommand } from '../application/use-cases/register-user.usecase';
import { InputLoginDto } from '../../users/api/dto/input/login.input-dto';
import { InputNewPasswordDto } from '../../users/api/dto/input/new-password.input-dto';
import { InputRegistrationDto } from '../../users/api/dto/input/registration.input-dto';
import { InputPasswordRecoveryDto } from '../../users/api/dto/input/password-recovery.input-dto';
import { LoginUserGoogleCommand } from '@lumio/modules/user-accounts/auth/application/use-cases/login-user-google.usecase';
import { AUTH_BASE, AUTH_ROUTES } from '@lumio/core/routs/routs';

@UseGuards(ThrottlerGuard)
@Controller(AUTH_BASE)
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}
  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(@Body() dto: InputRegistrationDto): Promise<void> {
    return await this.commandBus.execute<RegisterUserCommand, void>(
      new RegisterUserCommand(dto),
    );
  }

  @Post(AUTH_ROUTES.LOGIN)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: InputLoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<{ accessToken: string }> {
    const ip: string =
      req.socket.remoteAddress ||
      (Array.isArray(req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'][0]
        : req.headers['x-forwarded-for']) ||
      'unknown';

    const userAgent = (req.headers['user-agent'] || 'unknown').trim();

    const { accessToken, refreshToken } = await this.commandBus.execute<
      LoginUserCommand,
      { accessToken: string; refreshToken: string }
    >(new LoginUserCommand(dto, userAgent, ip));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }
  @SkipThrottle()
  @UseGuards(RefreshTokenGuard)
  @Post(AUTH_ROUTES.LOGOUT)
  @HttpCode(204)
  async logout(@Req() req: any): Promise<void> {
    return await this.commandBus.execute<LogoutUserCommand, void>(
      new LogoutUserCommand(req.user.userId, req.user.deviceId),
    );
  }

  @Post(AUTH_ROUTES.PASSWORD_RECOVERY)
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() dto: InputPasswordRecoveryDto): Promise<void> {
    return await this.commandBus.execute<PasswordRecoveryCommand, void>(
      new PasswordRecoveryCommand(dto),
    );
  }

  @Post(AUTH_ROUTES.NEW_PASSWORD)
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() dto: InputNewPasswordDto): Promise<void> {
    return await this.commandBus.execute<NewPasswordCommand, void>(
      new NewPasswordCommand(dto),
    );
  }

  @SkipThrottle()
  @Get(AUTH_ROUTES.GITHUB)
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // Guard сам сделает 302 на GitHub, код не нужен
  }

  @SkipThrottle()
  @Get(AUTH_ROUTES.GITHUB_CALLBACK)
  @UseGuards(AuthGuard('github'))
  async githubCallback(
    @Req() req,
    @Res() res: Response,
  ): Promise<{ accessToken: string }> {
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

    res.json({ accessToken });
    return { accessToken };
  }

  @UseGuards(AuthGuard('google'))
  @Get(AUTH_ROUTES.GOOGLE)
  async googleLogin() {
    // Guard сам инициирует редирект — ничего не нужно
  }

  @UseGuards(AuthGuard('google'))
  @Get(AUTH_ROUTES.GOOGLE_CALLBACK)
  async googleCallback(
    @Req() req: any,
    @Res() res: Response,
  ): Promise<{ accessToken: string }> {
    const ip: string =
      req.socket.remoteAddress ||
      (Array.isArray(req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'][0]
        : req.headers['x-forwarded-for']) ||
      'unknown';

    const deviceName = req.headers['user-agent'] || 'unknown';

    const user = req.user;

    const { accessToken, refreshToken } = await this.commandBus.execute<
      LoginUserGoogleCommand,
      { accessToken: string; refreshToken: string }
    >(new LoginUserGoogleCommand(user, deviceName, ip));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
    return { accessToken };
  }
}

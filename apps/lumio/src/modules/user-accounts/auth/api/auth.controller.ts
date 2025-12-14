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
import { ApiRegistration } from '@lumio/core/decorators/swagger/registration.decorator';
import { ApiLogin } from '@lumio/core/decorators/swagger/login.decorator';
import { ApiLogout } from '@lumio/core/decorators/swagger/logout.decorator';
import { ApiPasswordRecovery } from '@lumio/core/decorators/swagger/password-recovery.decorator';
import { ApiGithubCallback } from '@lumio/core/decorators/swagger/github-callback.decorator';
import { ApiNewPassword } from '@lumio/core/decorators/swagger/new-password.decorator';
import { ApiGoogleCallback } from '@lumio/core/decorators/swagger/google-callback.decorator';
import { ApiGithub } from '@lumio/core/decorators/swagger/github.decorator';
import { ApiGoogle } from '@lumio/core/decorators/swagger/google.decorator';
import { RegistrationConfirmationUserCommand } from '@lumio/modules/user-accounts/auth/application/use-cases/registration-confirmation.usecase';
import { RegistrationConfirmationInputDto } from '@lumio/modules/user-accounts/users/api/dto/input/registration-confirmation.input-dto';
import { ApiRegistrationConfirmation } from '@lumio/core/decorators/swagger/registration-confirmation.decorator';
import { LoginUserYandexCommand } from '@lumio/modules/user-accounts/auth/application/use-cases/login-user-yandex.usecase';
import { ApiYandex } from '@lumio/core/decorators/swagger/yandex.decorator';
import { ApiYandexCallback } from '@lumio/core/decorators/swagger/yandex-callback.decorator';
import {
  getClearCookieOptions,
  getLoginCookieOptions,
  getOAuthCookieOptions,
} from '../../config/cookie.helper';
import { CoreConfig } from '@lumio/core/core.config';

@UseGuards(ThrottlerGuard)
@Controller(AUTH_BASE)
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly coreConfig: CoreConfig,
  ) {}

  @Post(AUTH_ROUTES.REGISTRATION)
  @ApiRegistration()
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(@Body() dto: InputRegistrationDto): Promise<void> {
    return await this.commandBus.execute<RegisterUserCommand, void>(
      new RegisterUserCommand(dto),
    );
  }

  @Post(AUTH_ROUTES.LOGIN)
  @ApiLogin()
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

    res.cookie('refreshToken', refreshToken, getLoginCookieOptions(req));

    return { accessToken };
  }

  @Post(AUTH_ROUTES.LOGOUT)
  @ApiLogout()
  @SkipThrottle()
  @UseGuards(RefreshTokenGuard)
  @HttpCode(204)
  async logout(@Req() req: any, @Res() res: Response): Promise<void> {
    await this.commandBus.execute<LogoutUserCommand, void>(
      new LogoutUserCommand(req.user.userId, req.user.deviceId),
    );

    res.clearCookie('refreshToken', getClearCookieOptions(req));
  }

  @Post(AUTH_ROUTES.PASSWORD_RECOVERY)
  @ApiPasswordRecovery()
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() dto: InputPasswordRecoveryDto): Promise<void> {
    return await this.commandBus.execute<PasswordRecoveryCommand, void>(
      new PasswordRecoveryCommand(dto),
    );
  }

  @Post(AUTH_ROUTES.NEW_PASSWORD)
  @ApiNewPassword()
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() dto: InputNewPasswordDto): Promise<void> {
    return await this.commandBus.execute<NewPasswordCommand, void>(
      new NewPasswordCommand(dto),
    );
  }

  @Get(AUTH_ROUTES.GITHUB)
  @ApiGithub()
  @SkipThrottle()
  @UseGuards(AuthGuard('github'))
  async githubLogin(): Promise<void> {
    // Guard сам инициирует редирект — ничего не нужно
  }

  @Get(AUTH_ROUTES.GITHUB_CALLBACK)
  @ApiGithubCallback()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('github'))
  @SkipThrottle()
  async githubCallback(@Req() req, @Res() res: Response): Promise<void> {
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

    res.cookie('refreshToken', refreshToken, getOAuthCookieOptions(req));

    res.redirect(
      `${this.coreConfig.frontendUrl}/oauth-success?accessToken=${accessToken}`,
    );
  }

  @Get(AUTH_ROUTES.GOOGLE)
  @ApiGoogle()
  @UseGuards(AuthGuard('google'))
  async googleLogin(): Promise<void> {
    // Guard сам инициирует редирект — ничего не нужно
  }

  @Get(AUTH_ROUTES.GOOGLE_CALLBACK)
  @ApiGoogleCallback()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response): Promise<void> {
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

    res.cookie('refreshToken', refreshToken, getOAuthCookieOptions(req));

    res.redirect(
      `${this.coreConfig.frontendUrl}/oauth-success?accessToken=${accessToken}`,
    );
  }

  @Get(AUTH_ROUTES.YANDEX)
  @ApiYandex()
  @UseGuards(AuthGuard('yandex'))
  async yandexLogin(): Promise<void> {
    // Guard сам инициирует редирект — ничего не нужно
  }

  @Get(AUTH_ROUTES.YANDEX_CALLBACK)
  @ApiYandexCallback()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('yandex'))
  async yandexCallback(@Req() req: any, @Res() res: Response): Promise<void> {
    const ip: string =
      req.socket.remoteAddress ||
      (Array.isArray(req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'][0]
        : req.headers['x-forwarded-for']) ||
      'unknown';

    const deviceName = req.headers['user-agent'] || 'unknown';

    const user = req.user;

    const { accessToken, refreshToken } = await this.commandBus.execute<
      LoginUserYandexCommand,
      { accessToken: string; refreshToken: string }
    >(new LoginUserYandexCommand(user, deviceName, ip));

    res.cookie('refreshToken', refreshToken, getOAuthCookieOptions(req));

    res.redirect(
      `${this.coreConfig.frontendUrl}/oauth-success?accessToken=${accessToken}`,
    );
  }

  @ApiRegistrationConfirmation()
  @Post(AUTH_ROUTES.REGISTRATION_CONFIRMATION)
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipThrottle()
  async registrationConfirmation(
    @Body() dto: RegistrationConfirmationInputDto,
  ): Promise<void> {
    return await this.commandBus.execute<
      RegistrationConfirmationUserCommand,
      void
    >(new RegistrationConfirmationUserCommand(dto.confirmCode));
  }
}

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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Response, Request } from 'express';
import { RefreshTokenGuard } from '@lumio/core/guards/refresh/refresh-token.guard';
import { AuthGuard } from '@nestjs/passport';
import { LoginUserCommand } from '../application/commands/login-user.command-handler';
import { LogoutUserCommand } from '../application/commands/logout-user.command-handler';
import { NewPasswordCommand } from '../application/commands/new-password.command-handler';
import { PasswordRecoveryCommand } from '../application/commands/password-recovery.command-handler';
import { RegisterUserCommand } from '../application/commands/register-user.command-handler';
import { InputLoginDto } from '../../users/api/dto/input/login.input.dto';
import { InputNewPasswordDto } from '../../users/api/dto/input/new-password.input.dto';
import { InputRegistrationDto } from '../../users/api/dto/input/registration.input.dto';
import { InputPasswordRecoveryDto } from '../../users/api/dto/input/password-recovery.input.dto';
import { ApiRegistration } from '@lumio/core/decorators/swagger/auth/registration.decorator';
import { ApiLogin } from '@lumio/core/decorators/swagger/auth/login.decorator';
import { ApiLogout } from '@lumio/core/decorators/swagger/auth/logout.decorator';
import { ApiPasswordRecovery } from '@lumio/core/decorators/swagger/auth/password-recovery.decorator';
import { ApiNewPassword } from '@lumio/core/decorators/swagger/auth/new-password.decorator';
import { RegistrationConfirmationUserCommand } from '@lumio/modules/user-accounts/auth/application/commands/registration-confirmation.command-handler';
import { InputRegistrationConfirmationDto } from '@lumio/modules/user-accounts/users/api/dto/input/registration-confirmation.input.dto';
import { ApiRegistrationConfirmation } from '@lumio/core/decorators/swagger/auth/registration-confirmation.decorator';
import { LoginUserYandexCommand } from '@lumio/modules/user-accounts/auth/application/commands/login-user-yandex.command-handler';
import { ApiYandex } from '@lumio/core/decorators/swagger/auth/yandex.decorator';
import { ApiYandexCallback } from '@lumio/core/decorators/swagger/auth/yandex-callback.decorator';
import { RefreshTokenCommand } from '@lumio/modules/user-accounts/auth/application/commands/refresh-token.command-handler';
import { ApiRefreshToken } from '@lumio/core/decorators/swagger/auth/refresh-token.decorator';
import {
  getClearCookieOptions,
  getStrictCookieOptions,
} from '../../config/cookie.helper';
import { CoreConfig } from '@lumio/core/core.config';
import { getClientIp, getUserAgent } from '@lumio/core/utils/request.utils';
import { AboutUserUserQuery } from '@lumio/modules/user-accounts/auth/application/queries/about-user.query-handler';
import { AboutUserOutputDto } from '@lumio/modules/user-accounts/users/api/dto/output/about-user.output.dto';
import { ApiGetCurrentUser } from '@lumio/core/decorators/swagger/auth/me.decorator';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { AUTH_BASE, AUTH_ROUTES } from '@lumio/core/routes/auth-routes';

@UseGuards(ThrottlerGuard)
@Controller(AUTH_BASE)
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly coreConfig: CoreConfig,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(AUTH_ROUTES.ME)
  @ApiGetCurrentUser()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any): Promise<AboutUserOutputDto> {
    const user = await this.queryBus.execute<
      AboutUserUserQuery,
      AboutUserOutputDto
    >(new AboutUserUserQuery(req.user.userId));

    return user;
  }

  @Get(AUTH_ROUTES.YANDEX)
  @ApiYandex()
  @UseGuards(AuthGuard('yandex'))
  async yandexLogin(): Promise<void> {}

  @Get(AUTH_ROUTES.YANDEX_CALLBACK)
  @ApiYandexCallback()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('yandex'))
  async yandexCallback(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const ip = getClientIp(req);
    const deviceName = getUserAgent(req);

    const { refreshToken, accessToken } = await this.commandBus.execute<
      LoginUserYandexCommand,
      { refreshToken: string; accessToken: string }
    >(new LoginUserYandexCommand(req.user, deviceName, ip));

    res.cookie('refreshToken', refreshToken, getStrictCookieOptions(req));

    res.redirect(
      `${this.coreConfig.frontendUrl}/auth/oauth-success?accessToken=${accessToken}`,
    );
  }

  @Post(AUTH_ROUTES.REGISTRATION)
  @ApiRegistration()
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(@Body() dto: InputRegistrationDto): Promise<void> {
    return await this.commandBus.execute<RegisterUserCommand, void>(
      new RegisterUserCommand(dto),
    );
  }

  @Post(AUTH_ROUTES.REGISTRATION_CONFIRMATION)
  @ApiRegistrationConfirmation()
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipThrottle()
  async registrationConfirmation(
    @Body() dto: InputRegistrationConfirmationDto,
  ): Promise<void> {
    return await this.commandBus.execute<
      RegistrationConfirmationUserCommand,
      void
    >(new RegistrationConfirmationUserCommand(dto.confirmCode));
  }

  @Post(AUTH_ROUTES.LOGIN)
  @ApiLogin()
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: InputLoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<{ accessToken: string }> {
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    const { accessToken, refreshToken } = await this.commandBus.execute<
      LoginUserCommand,
      { accessToken: string; refreshToken: string }
    >(new LoginUserCommand(dto, userAgent, ip));

    res.cookie('refreshToken', refreshToken, getStrictCookieOptions(req));

    return { accessToken };
  }

  @Post(AUTH_ROUTES.LOGOUT)
  @ApiLogout()
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: any, @Res() res: Response): Promise<void> {
    await this.commandBus.execute<LogoutUserCommand, void>(
      new LogoutUserCommand(req.user.userId, req.user.deviceId),
    );

    res
      .clearCookie(
        'refreshToken',
        getClearCookieOptions(getStrictCookieOptions(req)),
      )
      .end();
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

  @Post(AUTH_ROUTES.REFRESH_TOKEN)
  @ApiRefreshToken()
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const { deviceName, ip, userId, deviceId } = req.user;

    const { accessToken, refreshToken } = await this.commandBus.execute<
      RefreshTokenCommand,
      { accessToken: string; refreshToken: string }
    >(new RefreshTokenCommand(deviceName, ip, userId, deviceId));

    res.cookie('refreshToken', refreshToken, getStrictCookieOptions(req));

    return { accessToken };
  }
}

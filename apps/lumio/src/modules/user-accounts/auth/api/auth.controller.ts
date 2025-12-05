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
import { loginInputDto } from '../../users/api/models/dto/input/login.input-dto';
import { NewPasswordInputDto } from '../../users/api/models/dto/input/new-password.input-dto';
import { PasswordRecoveryInputDto } from '../../users/api/models/dto/input/password-recovery.input-dto';
import { registrationInputDto } from '../../users/api/models/dto/input/registration.input-dto';
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}
  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(@Body() dto: registrationInputDto) {
    await this.commandBus.execute<RegisterUserCommand, void>(
      new RegisterUserCommand(dto),
    );
  }

  @Post('login')
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
  @SkipThrottle()
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
  async passwordRecovery(@Body() dto: PasswordRecoveryInputDto) {
    await this.commandBus.execute<PasswordRecoveryCommand, void>(
      new PasswordRecoveryCommand(dto),
    );
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() dto: NewPasswordInputDto) {
    await this.commandBus.execute<NewPasswordCommand, void>(
      new NewPasswordCommand(dto),
    );
  }

  @SkipThrottle()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // Guard сам сделает 302 на GitHub, код не нужен
  }

  @SkipThrottle()
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

    //res.json({ accessToken });   ----- это прервать запрос для теста сработал поинт или нет
    return { accessToken };
  }
}

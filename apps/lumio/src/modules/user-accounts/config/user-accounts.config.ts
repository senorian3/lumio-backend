import { Injectable } from '@nestjs/common';
import { IsNotEmpty } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { configValidationUtility } from '@libs/settings/config-valdation.utility';

@Injectable()
export class UserAccountsConfig {
  @IsNotEmpty({
    message: 'Set Env variable ACCESS_TOKEN_EXPIRE_IN, examples: 1h, 5m, 2d',
  })
  accessTokenExpireIn: string;

  @IsNotEmpty({
    message: 'Set Env variable REFRESH_TOKEN_EXPIRE_IN, examples: 1h, 5m, 2d',
  })
  refreshTokenExpireIn: string;

  @IsNotEmpty({
    message: 'Set Env variable REFRESH_TOKEN_SECRET, dangerous for security!',
  })
  refreshTokenSecret: string;

  @IsNotEmpty({
    message: 'Set Env variable ACCESS_TOKEN_SECRET, dangerous for security!',
  })
  accessTokenSecret: string;

  @IsNotEmpty({
    message: 'Set Env variable SMTP_HOST',
  })
  smtpHost: string;

  @IsNotEmpty({
    message: 'Set Env variable SMTP_PORT',
  })
  smtpPort: number;

  @IsNotEmpty({
    message: 'Set Env variable SMTP_SECURE',
  })
  smtpSecure: boolean;

  @IsNotEmpty({
    message: 'Set Env variable SMTP_USER',
  })
  smtpUser: string;

  @IsNotEmpty({
    message: 'Set Env variable SMPT_COM_PASS',
  })
  smtpPassword: string;

  constructor(private readonly configService: ConfigService<any, true>) {
    this.accessTokenExpireIn = this.configService.get('ACCESS_TOKEN_EXPIRE_IN');
    this.refreshTokenExpireIn = this.configService.get(
      'REFRESH_TOKEN_EXPIRE_IN',
    );
    this.refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
    this.accessTokenSecret = this.configService.get('ACCESS_TOKEN_SECRET');

    this.smtpHost = this.configService.get<string>('SMTP_HOST');
    this.smtpPort = this.configService.get<number>('SMTP_PORT');
    this.smtpSecure = this.configService.get<boolean>('SMTP_SECURE');
    this.smtpUser = this.configService.get<string>('SMTP_FROM_GMAIL');
    this.smtpPassword = this.configService.get<string>('SMPT_COM_PASS');

    configValidationUtility.validateConfig(this);
  }
}

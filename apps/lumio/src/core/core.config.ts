import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { configValidationUtility } from '@libs/settings/config-valdation.utility';

export enum Environments {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

@Injectable()
export class CoreConfig {
  @IsNumber({}, { message: 'Set Env variable PORT, example: 3000' })
  port: number = Number(this.configService.get('PORT'));

  @IsNotEmpty({
    message: 'Set Env variable FRONTEND_URL',
  })
  frontendUrl: string = this.configService.get('FRONTEND_URL');

  @IsNotEmpty({
    message:
      'Set Env variable DATABASE_URL, example: postgresql://localhost:27017/my-app-local-db',
  })
  dbUrl: string = this.configService.get('DATABASE_URL');

  @IsEnum(Environments, {
    message:
      'Set correct NODE_ENV value, available values: ' +
      configValidationUtility.getEnumValues(Environments).join(', '),
  })
  env: string = this.configService.get('NODE_ENV');

  @IsBoolean({
    message:
      'Set Env variable IS_SWAGGER_ENABLED to enable/disable Swagger, example: true, available values: true, false',
  })
  isSwaggerEnabled = configValidationUtility.convertToBoolean(
    this.configService.get('IS_SWAGGER_ENABLED'),
  ) as boolean;

  @IsBoolean({
    message:
      'Set Env variable INCLUDE_TESTING_MODULE to enable/disable Dangerous for production TestingModule, example: true, available values: true, false, 0, 1',
  })
  includeTestingModule: boolean = configValidationUtility.convertToBoolean(
    this.configService.get('INCLUDE_TESTING_MODULE'),
  ) as boolean;

  @IsNotEmpty({ message: 'Set Env variable RECAPTCHA_SECRET_KEY' })
  recaptchaSecretKey: string = this.configService.get('RECAPTCHA_SECRET_KEY');

  @IsNotEmpty({ message: 'Set Env variable YANDEX_CLIENT_ID' })
  yandexClientId: string = this.configService.get('YANDEX_CLIENT_ID');

  @IsNotEmpty({ message: 'Set Env variable YANDEX_CLIENT_SECRET' })
  yandexClientSecret: string = this.configService.get('YANDEX_CLIENT_SECRET');

  @IsNotEmpty({ message: 'Set Env variable YANDEX_CALLBACK_URL' })
  yandexCallbackUrl: string = this.configService.get('YANDEX_CALLBACK_URL');

  @IsNotEmpty({ message: 'Set Env variable INTERNAL_API_KEY' })
  internalApiKey: string = this.configService.get('INTERNAL_API_KEY');

  @IsNotEmpty({ message: 'Set Env variable FILES_FRONTEND_URL' })
  filesFrontendUrl: string = this.configService.get('FILES_FRONTEND_URL');

  @IsNumber(
    {},
    {
      message: 'Set Env variable THROTTLER_TTL in milliseconds, example: 10000',
    },
  )
  throttlerTtl: number = Number(this.configService.get('THROTTLER_TTL'));

  @IsNumber({}, { message: 'Set Env variable THROTTLER_LIMIT, example: 5' })
  throttlerLimit: number = Number(this.configService.get('THROTTLER_LIMIT'));

  constructor(private readonly configService: ConfigService<any, true>) {
    configValidationUtility.validateConfig(this);
  }
}

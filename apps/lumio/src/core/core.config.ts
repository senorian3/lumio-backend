import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { configValidationUtility } from '@libs/settings/config-valdation.utility';

export enum Environments {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

@Injectable()
export class CoreConfig {
  @IsNumber({}, { message: 'Set Env variable PORT, example: 3000' })
  port: number = Number(this.configService.get('PORT'));

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

  // --- OAuth2 GitHub ---
  @IsNotEmpty({ message: 'Set Env variable GITHUB_CLIENT_ID' })
  githubClientId: string = this.configService.get('GITHUB_CLIENT_ID');

  @IsNotEmpty({ message: 'Set Env variable GITHUB_CLIENT_SECRET' })
  githubClientSecret: string = this.configService.get('GITHUB_CLIENT_SECRET');

  @IsNotEmpty({ message: 'Set Env variable GITHUB_CALLBACK_URL' })
  githubCallbackUrl: string = this.configService.get('GITHUB_CALLBACK_URL');

  // --- OAuth2 Google ---
  @IsNotEmpty({ message: 'Set Env variable GOOGLE_CLIENT_ID' })
  googleClientId: string = this.configService.get('GOOGLE_CLIENT_ID');

  @IsNotEmpty({ message: 'Set Env variable GOOGLE_CLIENT_SECRET' })
  googleClientSecret: string = this.configService.get('GOOGLE_CLIENT_SECRET');

  @IsNotEmpty({ message: 'Set Env variable GOOGLE_CALLBACK_URL' })
  googleCallbackUrl: string = this.configService.get('GOOGLE_CALLBACK_URL');

  constructor(private configService: ConfigService<any, true>) {
    configValidationUtility.validateConfig(this);
  }
}

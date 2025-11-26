import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { configValidationUtility } from 'apps/libs/settings/config-valdation.utility';

export enum Environments {
  DEVELOPMENT = 'lumio.development',
  STAGING = 'lumio.staging',
  PRODUCTION = 'lumio.production',
  TESTING = 'lumio.testing',
}

@Injectable()
export class CoreConfig {
  @IsNumber(
    {},
    {
      message: 'Set Env variable PORT, example: 3000',
    },
  )
  port: number = Number(this.configService.get('PORT'));

  @IsNotEmpty({
    message:
      'Set Env variable PG_URI, example: postgresql://localhost:27017/my-app-local-db',
  })
  pgUri: string = this.configService.get('PG_URI');

  @IsEnum(Environments, {
    message:
      'Ser correct NODE_ENV value, available values: ' +
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

  @IsNotEmpty({
    message:
      'Set Env variable DB_USER, example: postgres, available values: postgres, postgres_test',
  })
  dbUser: string = this.configService.get('DB_USER');

  @IsNotEmpty({
    message:
      'Set Env variable DB_PASSWORD, example: 12345678, available values: 12345678',
  })
  dbPassword: string = this.configService.get('DB_PASSWORD');

  @IsNotEmpty({
    message:
      'Set Env variable DB_NAME, example: postgres, available values: postgres, postgres_test',
  })
  dbName: string = this.configService.get('DB_NAME');

  constructor(private configService: ConfigService<any, true>) {
    configValidationUtility.validateConfig(this);
  }
}

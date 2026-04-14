import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { configValidationUtility } from '@libs/settings/config-valdation.utility';

export enum Environments {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}

@Injectable()
export class CoreConfig {
  @IsNumber(
    {},
    {
      message: 'Set Env variable PORT, example: 3004',
    },
  )
  port: number = Number(this.configService.get('PORT'));

  @IsNotEmpty({
    message:
      'Set Env variable DATABASE_URL, example: postgresql://localhost:27017/my-app-local-db',
  })
  dbUrl: string = this.configService.get('DATABASE_URL');

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

  @IsNotEmpty({ message: 'Set Env variable INTERNAL_API_KEY' })
  internalApiKey: string = this.configService.get('INTERNAL_API_KEY');

  @IsNotEmpty({
    message:
      'Set Env variable INCLUDE_TESTING_MODULE to enable/disable Dangerous for production TestingModule, example: true, available values: true, false, 0, 1',
  })
  includeTestingModule: boolean = configValidationUtility.convertToBoolean(
    this.configService.get('INCLUDE_TESTING_MODULE'),
  ) as boolean;

  // RabbitMQ configuration
  @IsNotEmpty({ message: 'Set Env variable RABBITMQ_URL' })
  rabbitmqUrl: string = this.configService.get('RABBITMQ_URL');

  @IsNotEmpty({ message: 'Set Env variable RABBITMQ_QUEUE' })
  rabbitmqQueue: string = this.configService.get('RABBITMQ_QUEUE');

  constructor(private readonly configService: ConfigService<any, true>) {
    configValidationUtility.validateConfig(this);
  }
}

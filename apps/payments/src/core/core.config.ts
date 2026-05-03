import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { configValidationUtility } from '@libs/settings/config-valdation.utility';
import {
  InternalApiKeys,
  parseInternalApiKeys,
} from '@libs/core/internal-api/internal-api';

export enum Environments {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}

@Injectable()
export class CoreConfig {
  @IsNotEmpty({
    message: 'Set Env variable PORT, example: 3002',
  })
  @IsNumber(
    {},
    {
      message: 'Set Env variable PORT, example: 3002',
    },
  )
  port: number = Number(this.configService.get('PORT'));

  @IsNotEmpty({
    message:
      'Set Env variable DATABASE_URL, example: postgresql://localhost:27017/my-app-local-db',
  })
  dbUrl: string = this.configService.get('DATABASE_URL');

  @IsNotEmpty({
    message: 'Set Env variable RMQ_URL, example: amqp://localhost:5672',
  })
  rmqUrl: string = this.configService.get('RMQ_URL');

  @IsNotEmpty({ message: 'Set Env variable NODE_ENV, example: development' })
  @IsEnum(Environments, {
    message:
      'Ser correct NODE_ENV value, available values: ' +
      configValidationUtility.getEnumValues(Environments).join(', '),
  })
  env: string = this.configService.get('NODE_ENV');

  @IsNotEmpty({
    message:
      'Set Env variable IS_SWAGGER_ENABLED to enable/disable Swagger, example: true, available values: true, false',
  })
  @IsBoolean({
    message:
      'Set Env variable IS_SWAGGER_ENABLED to enable/disable Swagger, example: true, available values: true, false',
  })
  isSwaggerEnabled = configValidationUtility.convertToBoolean(
    this.configService.get('IS_SWAGGER_ENABLED'),
  ) as boolean;

  @IsNotEmpty({ message: 'Set Env variable STRIPE_API_KEY' })
  stripeApiKey: string = this.configService.get('STRIPE_API_KEY');

  @IsNotEmpty({
    message: 'Set Env variable STRIPE_SUCCESS_URL',
  })
  stripeSuccessUrl: string = this.configService.get('STRIPE_SUCCESS_URL');

  @IsNotEmpty({
    message: 'Set Env variable STRIPE_CANCEL_URL',
  })
  stripeCancelUrl: string = this.configService.get('STRIPE_CANCEL_URL');

  @IsNotEmpty({
    message: 'Set Env variable STRIPE_ENDPOINT_SECRET',
  })
  stripeEndpointSecret: string = this.configService.get(
    'STRIPE_ENDPOINT_SECRET',
  );

  @IsNotEmpty({ message: 'Set Env variable INTERNAL_API_KEY' })
  internalApiKey: string = this.configService.get('INTERNAL_API_KEY');

  @IsNotEmpty({ message: 'Set Env variable INTERNAL_SERVICE_NAME' })
  internalServiceName: string =
    this.configService.get('INTERNAL_SERVICE_NAME') ?? 'payments';

  @IsNotEmpty({ message: 'Set Env variable INTERNAL_API_KEYS' })
  internalApiKeys: InternalApiKeys = parseInternalApiKeys(
    this.configService.get('INTERNAL_API_KEYS'),
    this.internalApiKey,
  );

  @IsNotEmpty({
    message:
      'Set Env variable INCLUDE_TESTING_MODULE to enable/disable Dangerous for production TestingModule, example: true, available values: true, false, 0, 1',
  })
  includeTestingModule: boolean = configValidationUtility.convertToBoolean(
    this.configService.get('INCLUDE_TESTING_MODULE'),
  ) as boolean;

  constructor(private readonly configService: ConfigService<any, true>) {
    configValidationUtility.validateConfig(this);
  }
}

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
      message: 'Set Env variable PORT, example: 3003',
    },
  )
  port: number = Number(this.configService.get('PORT'));

  @IsNotEmpty({
    message:
      'Set Env variable DATABASE_URL, example: postgresql://localhost:5432/lumio',
  })
  dbUrl: string = this.configService.get('DATABASE_URL');

  @IsEnum(Environments, {
    message:
      'Set correct NODE_ENV value, available values: ' +
      configValidationUtility.getEnumValues(Environments).join(', '),
  })
  env: string = this.configService.get('NODE_ENV');

  @IsNotEmpty({
    message: 'Set Env variable IS_GRAPHQL_PLAYGROUND_ENABLED',
  })
  @IsBoolean({
    message:
      'Set Env variable IS_GRAPHQL_PLAYGROUND_ENABLED to enable/disable GraphQL Playground, example: true, available values: true, false',
  })
  isGraphqlPlaygroundEnabled = configValidationUtility.convertToBoolean(
    this.configService.get('IS_GRAPHQL_PLAYGROUND_ENABLED'),
  ) as boolean;

  @IsNotEmpty({
    message: 'Set Env variable IS_GRAPHQL_INTROSPECTION_ENABLED',
  })
  @IsBoolean({
    message:
      'Set Env variable IS_GRAPHQL_INTROSPECTION_ENABLED to enable/disable GraphQL Introspection, example: true, available values: true, false',
  })
  isGraphqlIntrospectionEnabled = configValidationUtility.convertToBoolean(
    this.configService.get('IS_GRAPHQL_INTROSPECTION_ENABLED'),
  ) as boolean;

  @IsNotEmpty({ message: 'Set Env variable INTERNAL_API_KEY' })
  internalApiKey: string = this.configService.get('INTERNAL_API_KEY');

  @IsNotEmpty({
    message:
      'Set Env variable PAYMENTS_SERVICE_URL, example: http://localhost:3001',
  })
  paymentsServiceUrl: string = this.configService.get('PAYMENTS_SERVICE_URL');

  @IsNotEmpty({
    message:
      'Set Env variable FILES_SERVICE_URL, example: http://localhost:3002',
  })
  filesServiceUrl: string = this.configService.get('FILES_SERVICE_URL');

  @IsNotEmpty({
    message: 'Set Env variable RMQ_URL, example: amqp://localhost:5672',
  })
  rmqUrl: string = this.configService.get('RMQ_URL');

  @IsNotEmpty({
    message: 'Set Env variable SUPER_ADMIN_SECRET',
  })
  superAdminSecret: string = this.configService.get('SUPER_ADMIN_SECRET');

  @IsNotEmpty({
    message: 'Set Env variable SUPER_ADMIN_EMAIL',
  })
  superAdminEmail: string = this.configService.get('SUPER_ADMIN_EMAIL');

  @IsNotEmpty({
    message: 'Set Env variable SUPER_ADMIN_PASSWORD',
  })
  superAdminPassword: string = this.configService.get('SUPER_ADMIN_PASSWORD');

  @IsNumber(
    {},
    {
      message:
        'Set Env variable SUPER_ADMIN_TOKEN_EXPIRATION_MINUTES, example: 15',
    },
  )
  superAdminTokenExpirationMinutes: number = Number(
    this.configService.get('SUPER_ADMIN_TOKEN_EXPIRATION_MINUTES'),
  );

  constructor(private readonly configService: ConfigService<any, true>) {
    configValidationUtility.validateConfig(this);
  }
}

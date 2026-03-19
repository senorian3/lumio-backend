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

  @IsBoolean({
    message:
      'Set Env variable IS_GRAPHQL_PLAYGROUND_ENABLED to enable/disable GraphQL Playground, example: true, available values: true, false',
  })
  isGraphqlPlaygroundEnabled = configValidationUtility.convertToBoolean(
    this.configService.get('IS_GRAPHQL_PLAYGROUND_ENABLED'),
  ) as boolean;

  @IsNotEmpty({ message: 'Set Env variable INTERNAL_API_KEY' })
  internalApiKey: string = this.configService.get('INTERNAL_API_KEY');

  constructor(private readonly configService: ConfigService<any, true>) {
    configValidationUtility.validateConfig(this);
  }
}

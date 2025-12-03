import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { IsNotEmpty, IsString, IsObject } from 'class-validator';
import { configValidationUtility } from 'libs/settings/config-valdation.utility';

@Injectable()
export class MessagingConfig {
  @IsNotEmpty({ message: 'RABBITMQ_URL is required' })
  @IsString()
  rabbitmqUrl: string;

  @IsObject()
  rabbitmqQueues = {
    userEvents: 'user.events',
    fileEvents: 'file.events',
  };

  @IsObject()
  rabbitmqExchanges = {
    user: 'user.exchange',
    file: 'file.exchange',
  };

  constructor(private configService: ConfigService) {
    this.rabbitmqUrl = this.configService.get('RABBITMQ_URL');
    configValidationUtility.validateConfig(this);
  }
}

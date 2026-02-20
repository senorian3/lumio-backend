import { ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CoreConfig } from './core.config';
import { RabbitMQSetupService } from './rabbitmq-setup.service';

@Global()
@Module({
  imports: [CqrsModule],
  exports: [CoreConfig, CqrsModule, RabbitMQSetupService],
  providers: [CoreConfig, ConfigService, RabbitMQSetupService],
})
export class CoreModule {}

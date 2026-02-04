import { ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CoreConfig } from './core.config';
import { RabbitMQSetupService } from './rabbitmq-setup.service';
import { RedisModule } from './redis/redis.module';

@Global()
@Module({
  imports: [CqrsModule, RedisModule],
  exports: [CoreConfig, CqrsModule, RabbitMQSetupService, RedisModule],
  providers: [CoreConfig, ConfigService, RabbitMQSetupService],
})
export class CoreModule {}

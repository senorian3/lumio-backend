import { Module } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@nestjs-modules/ioredis';
import { CoreConfig } from '../core.config';

@Module({
  imports: [
    NestRedisModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => {
        return {
          type: 'single',
          url: coreConfig.redisUrl,
        };
      },
      inject: [CoreConfig],
    }),
  ],
  exports: [NestRedisModule],
})
export class RedisModule {}

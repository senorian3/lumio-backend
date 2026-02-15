import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class IdempotencyService {
  private readonly PREFIX = 'message:id:';
  private readonly TTL = 86400;

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async tryMarkAsProcessed(messageId: string): Promise<boolean> {
    if (!messageId) {
      return false;
    }

    const key = this.PREFIX + messageId;
    const result = await this.redis.set(key, 'processed', 'EX', this.TTL, 'NX');
    return result === 'OK';
  }

  async isMessageProcessed(messageId: string): Promise<boolean> {
    if (!messageId) {
      return false;
    }

    const key = this.PREFIX + messageId;
    const result = await this.redis.exists(key);
    return result === 1;
  }
}

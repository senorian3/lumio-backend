import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class IdempotencyService {
  private readonly PREFIX = 'message:id:';
  private readonly TTL = 86400; // 24 часа в секундах

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async isMessageProcessed(messageId: string): Promise<boolean> {
    if (!messageId) {
      return false;
    }

    const key = this.PREFIX + messageId;
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async markMessageAsProcessed(messageId: string): Promise<void> {
    if (!messageId) {
      return;
    }

    const key = this.PREFIX + messageId;
    await this.redis.setex(key, this.TTL, 'processed');
  }

  async clearMessage(messageId: string): Promise<void> {
    if (!messageId) {
      return;
    }

    const key = this.PREFIX + messageId;
    await this.redis.del(key);
  }
}

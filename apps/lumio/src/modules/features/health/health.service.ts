import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import * as amqp from 'amqplib';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkDatabase(): Promise<{ status: string; error?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', error: error.message };
    }
  }

  async checkRabbitMQ(
    rmqUrl: string,
  ): Promise<{ status: string; error?: string }> {
    try {
      const connection = await amqp.connect(rmqUrl);
      await connection.close();
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', error: error.message };
    }
  }

  async checkAll(rmqUrl: string) {
    const [database, rabbitmq] = await Promise.all([
      this.checkDatabase(),
      this.checkRabbitMQ(rmqUrl),
    ]);

    const isHealthy = database.status === 'up' && rabbitmq.status === 'up';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database,
        rabbitmq,
      },
    };
  }
}

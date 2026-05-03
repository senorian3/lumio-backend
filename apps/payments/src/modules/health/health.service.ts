import { Injectable } from '@nestjs/common';
import { PrismaService } from '@payments/prisma/prisma.service';
import * as amqp from 'amqplib';

type HealthCheckResult = { status: 'up' | 'down'; error?: string };

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkDatabase(): Promise<HealthCheckResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up' };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async checkRabbitMQ(rmqUrl: string): Promise<HealthCheckResult> {
    try {
      const connection = await amqp.connect(rmqUrl);
      await connection.close();
      return { status: 'up' };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async checkAll(rmqUrl: string) {
    const [database, rabbitmq] = await Promise.all([
      this.checkDatabase(),
      this.checkRabbitMQ(rmqUrl),
    ]);

    return {
      status:
        database.status === 'up' && rabbitmq.status === 'up'
          ? 'ok'
          : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database,
        rabbitmq,
      },
    };
  }
}

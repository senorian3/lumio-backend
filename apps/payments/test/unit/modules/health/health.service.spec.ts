import { HealthService } from '@payments/modules/health/health.service';
import * as amqp from 'amqplib';

jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));

describe('Payments HealthService', () => {
  it('returns ok when database and RabbitMQ respond', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    (amqp.connect as jest.Mock).mockResolvedValue({ close: jest.fn() });
    const service = new HealthService(prisma as any);

    const result = await service.checkAll('amqp://localhost:5672');

    expect(result.status).toBe('ok');
    expect(result.services.database.status).toBe('up');
    expect(result.services.rabbitmq.status).toBe('up');
  });

  it('returns degraded when RabbitMQ check fails', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    (amqp.connect as jest.Mock).mockRejectedValue(new Error('rmq unavailable'));
    const service = new HealthService(prisma as any);

    const result = await service.checkAll('amqp://localhost:5672');

    expect(result.status).toBe('degraded');
    expect(result.services.rabbitmq).toEqual({
      status: 'down',
      error: 'rmq unavailable',
    });
  });
});

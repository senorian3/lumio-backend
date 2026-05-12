import { HealthService } from '@chat/modules/health/health.service';

describe('Chat HealthService', () => {
  it('returns ok when the database responds', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const service = new HealthService(prisma as any);

    const result = await service.checkAll();

    expect(result.status).toBe('ok');
    expect(result.services.database.status).toBe('up');
  });
});

import { HealthService } from '@files/modules/health/health.service';

describe('Files HealthService', () => {
  it('returns ok when the database responds', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const service = new HealthService(prisma as any);

    const result = await service.checkAll();

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result.status).toBe('ok');
    expect(result.services.database.status).toBe('up');
  });

  it('returns degraded when the database check fails', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('db unavailable')),
    };
    const service = new HealthService(prisma as any);

    const result = await service.checkAll();

    expect(result.status).toBe('degraded');
    expect(result.services.database).toEqual({
      status: 'down',
      error: 'db unavailable',
    });
  });
});

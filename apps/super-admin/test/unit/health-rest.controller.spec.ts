import { HealthRestController } from '@super-admin/modules/health/health-rest.controller';
import { HealthRestService } from '@super-admin/modules/health/health-rest.service';

describe('HealthRestController', () => {
  it('returns service health', async () => {
    const healthService = {
      checkAll: jest.fn().mockResolvedValue({
        status: 'ok',
        timestamp: '2026-05-04T00:00:00.000Z',
        services: {
          database: { status: 'up' },
        },
      }),
    };
    const controller = new HealthRestController(
      healthService as unknown as HealthRestService,
    );

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      timestamp: '2026-05-04T00:00:00.000Z',
      services: {
        database: { status: 'up' },
      },
    });
  });
});

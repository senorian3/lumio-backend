import { Test, TestingModule } from '@nestjs/testing';
import { HealthResolver } from '@super-admin/modules/health/health.resolver';

describe('HealthResolver', () => {
  let resolver: HealthResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthResolver],
    }).compile();

    resolver = module.get<HealthResolver>(HealthResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should return health status object', () => {
    const result = resolver.health();

    expect(result).toBeDefined();
    expect(result.status).toBe('OK');
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(typeof result.uptime).toBe('number');
    expect(result.database).toBeDefined();
    expect(result.database.status).toBe('CONNECTED');
    expect(typeof result.database.responseTime).toBe('number');
  });

  it('should return version', () => {
    expect(resolver.version()).toBe('1.0.0');
  });
});

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

  it('should return health status', () => {
    expect(resolver.health()).toBe('Super Admin service is healthy');
  });

  it('should return version', () => {
    expect(resolver.version()).toBe('1.0.0');
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { InternalApiGuard } from '../../../../../../files/src/core/guards/internal/internal-api.guard';
import { CoreConfig } from '../../../../../src/core/core.config';
import { UnauthorizedDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ExecutionContext } from '@nestjs/common';

describe('InternalApiGuard', () => {
  let guard: InternalApiGuard;

  const mockCoreConfig = {
    internalApiKey: 'internal-api-key-7f3b5a1e-4d2c-4a9b-8c7d-6e5f4a3b2c1d',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalApiGuard,
        {
          provide: CoreConfig,
          useValue: mockCoreConfig,
        },
      ],
    }).compile();

    guard = module.get<InternalApiGuard>(InternalApiGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw UnauthorizedDomainException when no API key is provided', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedDomainException,
    );
  });

  it('should throw UnauthorizedDomainException when invalid API key is provided', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            'x-internal-api-key': 'invalid-key',
          },
        }),
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedDomainException,
    );
  });

  it('should return true when valid API key is provided', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            'x-internal-api-key': mockCoreConfig.internalApiKey,
          },
        }),
      }),
    } as ExecutionContext;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });
});

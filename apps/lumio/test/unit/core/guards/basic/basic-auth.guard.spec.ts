import { Test, TestingModule } from '@nestjs/testing';
import { BasicAuthGuard } from '@lumio/core/guards/basic/basic-auth.guard';
import { UnauthorizedDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ExecutionContext } from '@nestjs/common';

describe('BasicAuthGuard', () => {
  let guard: BasicAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BasicAuthGuard],
    }).compile();

    guard = module.get<BasicAuthGuard>(BasicAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid credentials', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Basic YWRtaW46cXdlcnR5', // admin:qwerty
            },
          }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedDomainException when no authorization header', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedDomainException,
      );
    });

    it('should throw UnauthorizedDomainException when header does not start with Basic', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer token',
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedDomainException,
      );
    });

    it('should throw UnauthorizedDomainException for invalid username', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Basic dXNlcjpxd2VydHk=', // user:qwerty
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedDomainException,
      );
    });

    it('should throw UnauthorizedDomainException for invalid password', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Basic YWRtaW46d3Jvbmc=', // admin:wrong
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedDomainException,
      );
    });

    it('should throw UnauthorizedDomainException for malformed base64', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Basic invalid-base64',
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedDomainException,
      );
    });
  });
});

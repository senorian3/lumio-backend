import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { StripeWebhookGuard } from '@payments/core/guards/webhook/stripe-webhook.guard';

describe('StripeWebhookGuard', () => {
  let guard: StripeWebhookGuard;

  beforeEach(() => {
    guard = new StripeWebhookGuard();
  });

  const createMockContext = (
    signature: string | string[] | undefined,
    rawBody?: Buffer,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            'stripe-signature': signature,
          },
          rawBody,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should return true when valid signature and rawBody present', () => {
      const context = createMockContext(
        'v1=test_signature_123',
        Buffer.from('{"data": "test"}'),
      );

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when signature is missing', () => {
      const context = createMockContext(
        undefined,
        Buffer.from('{"data": "test"}'),
      );

      expect(() => guard.canActivate(context)).toThrow(
        new UnauthorizedException('Missing stripe-signature header'),
      );
    });

    it('should throw UnauthorizedException when rawBody is missing', () => {
      const context = createMockContext('v1=test_signature_123', undefined);

      expect(() => guard.canActivate(context)).toThrow(
        new UnauthorizedException('Missing webhook payload'),
      );
    });

    it('should throw UnauthorizedException when rawBody is empty', () => {
      const context = createMockContext(
        'v1=test_signature_123',
        Buffer.from(''),
      );

      expect(() => guard.canActivate(context)).toThrow(
        new UnauthorizedException('Missing webhook payload'),
      );
    });

    it('should throw UnauthorizedException when rawBody is not a Buffer', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'stripe-signature': 'v1=test_signature_123',
            },
            rawBody: 'not a buffer',
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(
        new UnauthorizedException('Missing webhook payload'),
      );
    });

    it('should throw UnauthorizedException when signature format is invalid', () => {
      const context = createMockContext(
        'invalid_signature',
        Buffer.from('{"data": "test"}'),
      );

      expect(() => guard.canActivate(context)).toThrow(
        new UnauthorizedException('Invalid stripe-signature format'),
      );
    });

    it('should handle signature as array and use first element', () => {
      const context = createMockContext(
        ['v1=test_signature_123', 'v2=other'],
        Buffer.from('{"data": "test"}'),
      );

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw when array signature has no valid v1 format', () => {
      const context = createMockContext(
        ['invalid1', 'invalid2'],
        Buffer.from('{"data": "test"}'),
      );

      expect(() => guard.canActivate(context)).toThrow(
        new UnauthorizedException('Invalid stripe-signature format'),
      );
    });
  });
});

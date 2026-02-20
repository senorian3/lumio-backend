import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class StripeWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { rawBody?: Buffer }>();

    const signature = request.headers['stripe-signature'];
    const rawBody = request.rawBody;

    if (!signature) {
      throw new UnauthorizedException('Missing stripe-signature header');
    }

    if (
      !rawBody ||
      Buffer.isBuffer(rawBody) === false ||
      rawBody.length === 0
    ) {
      throw new UnauthorizedException('Missing webhook payload');
    }

    const signatureStr = Array.isArray(signature) ? signature[0] : signature;
    if (!signatureStr || !signatureStr.includes('v1=')) {
      throw new UnauthorizedException('Invalid stripe-signature format');
    }

    return true;
  }
}

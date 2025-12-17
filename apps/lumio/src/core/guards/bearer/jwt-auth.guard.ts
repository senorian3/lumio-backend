import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user) {
    if (err || !user) {
      throw BadRequestDomainException.create('Unauthorized', 'accestoken');
    }
    return user;
  }
}

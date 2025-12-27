import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiSecurity } from '@nestjs/swagger';

export function ApiYandex() {
  return applyDecorators(
    ApiSecurity('oauth2', ['yandex']),
    ApiOperation({
      summary: 'Yandex OAuth2 authorization',
      description:
        'Initiate Yandex OAuth2 authentication flow. Redirects user to Yandex for authentication.',
      operationId: 'yandex',
    }),
  );
}

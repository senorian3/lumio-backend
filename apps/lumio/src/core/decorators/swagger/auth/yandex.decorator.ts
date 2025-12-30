import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function ApiYandex() {
  return applyDecorators(
    ApiOperation({
      summary: 'Yandex OAuth2 authorization',
      description:
        'Initiate Yandex OAuth2 authentication flow. Redirects user to Yandex for authentication.',
      operationId: 'yandex',
    }),
  );
}

import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiYandex() {
  return applyDecorators(
    ApiOperation({
      summary: 'Yandex OAuth2 authorization',
      description:
        'Initiate Yandex OAuth2 authentication flow. Redirects user to Yandex for authentication.',
      operationId: 'yandex',
    }),

    ApiResponse({
      status: 302,
      description: 'Redirects user to Yandex for authentication.',
    }),
  );
}

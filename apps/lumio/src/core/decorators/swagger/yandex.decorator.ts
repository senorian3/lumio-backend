import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function ApiYandex() {
  return applyDecorators(
    ApiOperation({
      summary: 'Yandex redirect',
      description: 'Endpoint for yandex',
      operationId: 'yandex',
    }),
  );
}

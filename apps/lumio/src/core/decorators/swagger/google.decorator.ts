import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function ApiGoogle() {
  return applyDecorators(
    ApiOperation({
      summary: 'Google redirect',
      description: 'Endpoint for google',
      operationId: 'google',
    }),
  );
}

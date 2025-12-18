import { applyDecorators } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation } from '@nestjs/swagger';

export function ApiGoogle() {
  return applyDecorators(
    ApiExcludeEndpoint(),
    ApiOperation({
      summary: 'Google redirect',
      description: 'Endpoint for google',
      operationId: 'google',
    }),
  );
}

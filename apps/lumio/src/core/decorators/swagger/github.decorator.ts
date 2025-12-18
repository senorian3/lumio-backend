import { applyDecorators } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation } from '@nestjs/swagger';

export function ApiGithub() {
  return applyDecorators(
    ApiExcludeEndpoint(),
    ApiOperation({
      summary: 'Github redirect',
      description: 'Endpoint for github',
      operationId: 'github',
    }),
  );
}

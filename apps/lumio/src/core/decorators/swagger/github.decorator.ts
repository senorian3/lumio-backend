import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function ApiGithub() {
  return applyDecorators(
    ApiOperation({
      summary: 'Github redirect',
      description: 'Endpoint for github',
      operationId: 'github',
    }),
  );
}

import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiTestingHealth() {
  return applyDecorators(
    ApiOperation({
      summary: 'Testing health check',
      description: 'Lightweight health endpoint for testing the chat service.',
      operationId: 'chatTestingHealthCheck',
    }),
    ApiResponse({
      status: 200,
      description: 'Chat testing endpoint is available',
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'ok',
          },
          service: {
            type: 'string',
            example: 'chat',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2026-06-11T10:51:00.000Z',
          },
        },
      },
    }),
  );
}

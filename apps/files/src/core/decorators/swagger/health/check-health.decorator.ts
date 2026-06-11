import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiCheckHealth() {
  return applyDecorators(
    ApiOperation({
      summary: 'Check files service health',
      description:
        'Returns the current health status for the files service and its dependencies.',
      operationId: 'checkFilesHealth',
    }),
    ApiResponse({
      status: 200,
      description: 'Health status successfully returned',
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ok', 'degraded'],
            example: 'ok',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2026-06-11T10:00:00.000Z',
          },
          services: {
            type: 'object',
            properties: {
              database: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['up', 'down'],
                    example: 'up',
                  },
                  error: {
                    type: 'string',
                    nullable: true,
                    example: 'Connection refused',
                  },
                },
                required: ['status'],
              },
            },
            required: ['database'],
          },
        },
        required: ['status', 'timestamp', 'services'],
      },
    }),
  );
}

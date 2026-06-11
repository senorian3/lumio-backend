import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiHealth() {
  return applyDecorators(
    ApiOperation({
      summary: 'Health check',
      description:
        'Endpoint for checking chat service health. Returns database connection status.',
      operationId: 'chatHealthCheck',
    }),
    ApiResponse({
      status: 200,
      description: 'Chat service health status',
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ok', 'degraded'],
            description: 'Overall service status',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp of health check',
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
                  },
                  error: {
                    type: 'string',
                    nullable: true,
                  },
                },
              },
            },
          },
        },
        example: {
          status: 'ok',
          timestamp: '2026-06-11T10:51:00.000Z',
          services: {
            database: {
              status: 'up',
            },
          },
        },
      },
    }),
  );
}

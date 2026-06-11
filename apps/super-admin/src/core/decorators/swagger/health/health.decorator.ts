import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiHealth() {
  return applyDecorators(
    ApiOperation({
      summary: 'Health check',
      description:
        'Endpoint for checking super-admin service health. Returns status of database connection.',
      operationId: 'superAdminHealthCheck',
    }),

    ApiResponse({
      status: 200,
      description: 'Service health status',
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

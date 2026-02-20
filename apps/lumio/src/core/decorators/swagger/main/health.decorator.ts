import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiHealth() {
  return applyDecorators(
    ApiOperation({
      summary: 'Health check',
      description:
        'Endpoint for checking service health. Returns status of database and RabbitMQ connections.',
      operationId: 'healthCheck',
    }),

    ApiResponse({
      status: 200,
      description: 'Service is healthy',
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
              rabbitmq: {
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
          timestamp: '2025-02-19T10:51:00.000Z',
          services: {
            database: {
              status: 'up',
            },
            rabbitmq: {
              status: 'up',
            },
          },
        },
      },
    }),
  );
}

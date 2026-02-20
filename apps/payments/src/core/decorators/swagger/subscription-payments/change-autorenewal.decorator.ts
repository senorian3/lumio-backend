import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiChangeAutorenewal() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Change subscription auto-renewal',
      description:
        'Internal endpoint for enabling or disabling subscription auto-renewal.',
      operationId: 'changeAutorenewal',
    }),
    ApiBody({
      description: 'Auto-renewal change payload',
      schema: {
        type: 'object',
        properties: {
          subscriptionId: {
            type: 'string',
            description: 'Subscription ID',
            example: 'sub_1234567890',
          },
          autorenewal: {
            type: 'boolean',
            description: 'Enable or disable auto-renewal',
            example: true,
          },
        },
        required: ['subscriptionId', 'autorenewal'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Auto-renewal changed successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Subscription not found',
      examples: {
        not_found: {
          summary: 'Subscription not found',
          value: {
            errorsMessages: [
              {
                message: 'Subscription does not exist',
                field: 'subscriptionId',
              },
            ],
          },
        },
      },
    }),
  );
}

import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiGetAllPayments() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Get all payments',
      description:
        'Internal endpoint for retrieving all payments with optional filters, pagination, and search.',
      operationId: 'getAllPayments',
    }),
    ApiQuery({
      name: 'profileIds',
      type: [Number],
      required: false,
      description: 'Filter by profile IDs (can be multiple)',
      example: [123, 456],
    }),
    ApiQuery({
      name: 'skip',
      type: Number,
      required: false,
      description: 'Number of items to skip (default: 0)',
      example: 0,
    }),
    ApiQuery({
      name: 'take',
      type: Number,
      required: false,
      description: 'Number of items to take (default: 10, max: 100)',
      example: 10,
    }),
    ApiQuery({
      name: 'sortBy',
      type: String,
      required: false,
      description: 'Field to sort by (default: createdAt)',
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortOrder',
      type: String,
      required: false,
      description: 'Sort order: asc or desc (default: desc)',
      example: 'desc',
      enum: ['asc', 'desc'],
    }),
    ApiQuery({
      name: 'search',
      type: String,
      required: false,
      description: 'Search term for filtering payments',
      example: 'stripe',
    }),
    ApiResponse({
      status: 200,
      description: 'Payments retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/UserProfilePaymentResponseDto',
            },
          },
          totalCount: {
            type: 'number',
            example: 25,
          },
        },
      },
      examples: {
        success: {
          summary: 'Payments successfully retrieved',
          value: {
            items: [
              {
                id: 1,
                datePayment: '2026-03-01T10:00:00.000Z',
                endDate: '2026-04-01T10:00:00.000Z',
                amount: 999,
                currency: 'RUB',
                paymentProvider: 'stripe',
                subscriptionType: '1 month',
              },
            ],
            totalCount: 1,
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request (e.g., invalid query parameters)',
      examples: {
        invalid_skip: {
          summary: 'Skip must be a non-negative number',
          value: {
            errorsMessages: [
              {
                message: 'skip must not be less than 0',
                field: 'skip',
              },
            ],
          },
        },
        invalid_take: {
          summary: 'Take must be between 1 and 100',
          value: {
            errorsMessages: [
              {
                message: 'take must not be greater than 100',
                field: 'take',
              },
            ],
          },
        },
        invalid_sort_order: {
          summary: 'Sort order must be asc or desc',
          value: {
            errorsMessages: [
              {
                message:
                  'sortOrder must be one of the following values: asc, desc',
                field: 'sortOrder',
              },
            ],
          },
        },
        invalid_profile_ids: {
          summary: 'Profile IDs must be numbers',
          value: {
            errorsMessages: [
              {
                message: 'each value in profileIds must be an integer number',
                field: 'profileIds',
              },
            ],
          },
        },
      },
    }),
  );
}

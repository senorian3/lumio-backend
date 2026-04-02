import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiGetUserProfilePayments() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Get user profile payments',
      description:
        'Internal endpoint for retrieving all payments for a user profile.',
      operationId: 'getUserProfilePayments',
    }),
    ApiQuery({
      name: 'profileId',
      type: Number,
      required: true,
      description: 'ID of the user profile (numeric value)',
      example: 123,
    }),
    ApiQuery({
      name: 'page',
      type: Number,
      required: false,
      description: 'Page number for pagination (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      type: Number,
      required: false,
      description: 'Number of items per page (default: 10, max: 100)',
      example: 10,
    }),
    ApiQuery({
      name: 'sortBy',
      type: String,
      required: false,
      description:
        'Sort order: date_asc, date_desc, amount_asc, amount_desc (default: date_desc)',
      example: 'date_desc',
      enum: ['date_asc', 'date_desc', 'amount_asc', 'amount_desc'],
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
          total: {
            type: 'number',
            example: 25,
          },
          page: {
            type: 'number',
            example: 1,
          },
          limit: {
            type: 'number',
            example: 10,
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request (e.g., invalid profileId)',
      examples: {
        invalid_profile_id: {
          summary: 'Invalid profile ID',
          value: {
            errorsMessages: [
              {
                message: 'Profile ID must be a valid numeric value',
                field: 'profileId',
              },
            ],
          },
        },
        profile_id_required: {
          summary: 'Profile ID is required',
          value: {
            errorsMessages: [
              {
                message: 'Profile ID is required',
                field: 'profileId',
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Profile not found or no payments',
      examples: {
        no_payments: {
          summary: 'No payments found for profile',
          value: {
            errorsMessages: [
              {
                message: 'No payments found for this profile',
                field: 'profileId',
              },
            ],
          },
        },
      },
    }),
  );
}

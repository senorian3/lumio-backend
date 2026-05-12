import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentsSortBy } from '@lumio/modules/payments/api/dto/input/get-user-payments.query';
import { SubscriptionType } from '@libs/core/types/subscription-type';

export function ApiGetUserPayments() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get user payment history',
      description:
        'Returns a paginated list of payments for the current authorized user',
      operationId: 'getUserPayments',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (default: 10, max: 100)',
      example: 10,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: PaymentsSortBy,
      description: 'Field to sort by (default: createdAt)',
      example: PaymentsSortBy.CREATED_AT,
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['ASC', 'DESC'],
      description: 'Sort order (default: DESC)',
      example: 'DESC',
    }),
    ApiResponse({
      status: 200,
      description: 'Payment history successfully retrieved',
      examples: {
        payments_retrieved: {
          summary: 'Payments successfully retrieved',
          value: {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 6,
            items: [
              {
                datePayment: '2026-02-18T09:17:35.000Z',
                endDate: '2026-02-25T09:17:35.000Z',
                amount: 2.99,
                currency: 'USD',
                paymentType: 'Stripe',
                subscriptionType: SubscriptionType.ONE_WEEK,
              },
              {
                datePayment: '2026-02-18T09:19:25.181Z',
                endDate: '2026-03-04T09:17:35.000Z',
                amount: 2.99,
                currency: 'USD',
                paymentType: 'Stripe',
                subscriptionType: SubscriptionType.ONE_WEEK,
              },
            ],
          },
        },
        no_payments: {
          summary: 'No payments found',
          value: {
            pagesCount: 0,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
          },
        },
      },
    }),

    ApiResponse({
      status: 401,
      description: 'Unauthorized',
      examples: {
        no_access_token: {
          summary: 'No access token in request',
          value: {
            errorsMessages: [],
          },
        },
        token_version_mismatch: {
          summary: 'Token version is expired',
          value: {
            errorsMessages: [
              {
                message: 'Token version mismatch - token is invalidated',
                field: 'tokenVersion',
              },
            ],
          },
        },
        invalid_jwt_data: {
          summary: 'Invalid user data in JWT',
          value: {
            errorsMessages: [
              {
                message: 'Invalid user data in JWT',
                field: 'user',
              },
            ],
          },
        },
        no_active_session: {
          summary: 'User does not have active session',
          value: {
            errorsMessages: [
              {
                message: "User doesn't have active session",
                field: 'session',
              },
            ],
          },
        },
      },
    }),

    ApiResponse({
      status: 404,
      description: 'Not Found',
      examples: {
        profile_not_found: {
          summary: 'Profile not found',
          value: {
            errorsMessages: [
              {
                message: 'Profile not found',
                field: 'profile',
              },
            ],
          },
        },
      },
    }),

    ApiResponse({
      status: 429,
      description: 'Too many requests',
      examples: {
        too_many_requests: {
          summary: 'Request limit exceeded',
          value: {
            errorsMessages: [
              {
                message: 'Too many requests',
              },
            ],
          },
        },
      },
    }),
  );
}

import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetUserPayments() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get user payment history',
      description:
        'Returns a paginated list of payments for the current authorized user',
      operationId: 'getUserPayments',
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
                subscriptionType: '1 week',
              },
              {
                datePayment: '2026-02-18T09:19:25.181Z',
                endDate: '2026-03-04T09:17:35.000Z',
                amount: 2.99,
                currency: 'USD',
                paymentType: 'Stripe',
                subscriptionType: '1 week',
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

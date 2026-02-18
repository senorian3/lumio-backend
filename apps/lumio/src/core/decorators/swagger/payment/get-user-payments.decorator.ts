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
        invalid_session: {
          summary: 'Invalid session or JWT',
          value: {
            errorMessages: [
              {
                message: "User doesn't have active session",
                field: 'session',
              },
            ],
          },
        },
        invalid_token: {
          summary: 'Token is invalid',
          value: {
            errorMessages: [
              {
                message: 'Invalid user data in JWT',
                field: 'user',
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
            errorMessages: [
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
            errorMessages: [
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

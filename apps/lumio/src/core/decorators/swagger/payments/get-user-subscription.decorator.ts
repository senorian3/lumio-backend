import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetUserSubscription() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get current user subscription',
      description:
        'Returns information about the current active subscription of the authorized user',
      operationId: 'getUserSubscription',
    }),
    ApiResponse({
      status: 200,
      description: 'Subscription information successfully retrieved',
      examples: {
        subscription_retrieved: {
          summary: 'Subscription successfully retrieved',
          value: {
            id: 'sub_abc123xyz',
            accountType: 'Business',
            durationType: '1 month',
            endDate: '2026-03-18T09:17:35.000Z',
            nextPaymentDate: '2026-03-18T09:17:35.000Z',
            autoRenewal: true,
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
            errorsMessages: [
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
            errorsMessages: [
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
            errorsMessages: [
              {
                message: 'Profile not found',
                field: 'profile',
              },
            ],
          },
        },
        no_active_subscription: {
          summary: "User doesn't have active subscription",
          value: {
            errorsMessages: [
              {
                message: "User doesn't have active subscription",
                field: 'userId',
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

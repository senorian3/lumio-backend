import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { InputCreateSubscriptionPaymentDto } from '@libs/dto/input/subscription-payment.input.dto';

export function ApiCreateSubscriptionPaymentUrl() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Create subscription payment URL',
      description:
        "Generates and returns a payment URL for the current authorized user's subscription",
      operationId: 'createSubscriptionPaymentUrl',
    }),
    ApiBody({
      type: InputCreateSubscriptionPaymentDto,
      description: 'Data for creating a subscription',
    }),
    ApiResponse({
      status: 200,
      description: 'Payment URL successfully generated',
      examples: {
        payment_url_created: {
          summary: 'URL successfully received',
          value: {
            url: 'https://payment.gateway.com/checkout/abc-123-xyz',
          },
        },
      },
    }),

    ApiResponse({
      status: 400,
      description: 'Bad Request (e.g., profile not found or invalid data)',
      examples: {
        profile_not_found: {
          summary: 'User profile does not exist',
          value: {
            errorsMessages: [
              {
                message: 'Profile does not exist',
                field: 'profileId',
              },
            ],
          },
        },
        invalid_subscription_type: {
          summary: 'Invalid subscription type',
          value: {
            errorsMessages: [
              {
                message:
                  'Invalid subscription type. Must be one of: 1 week, 2 weeks, 1 month, 3 months, 1 year',
                field: 'subscriptionType',
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
        profile_id_invalid: {
          summary: 'Profile ID must be a string',
          value: {
            errorsMessages: [
              {
                message: 'Profile ID must be a string',
                field: 'profileId',
              },
            ],
          },
        },
        currency_required: {
          summary: 'Currency is required',
          value: {
            errorsMessages: [
              {
                message: 'Currency is required',
                field: 'currency',
              },
            ],
          },
        },
        currency_invalid: {
          summary: 'Currency must be a string',
          value: {
            errorsMessages: [
              {
                message: 'Currency must be a string',
                field: 'currency',
              },
            ],
          },
        },
        subscription_type_required: {
          summary: 'Subscription type is required',
          value: {
            errorsMessages: [
              {
                message: 'Subscription type is required',
                field: 'subscriptionType',
              },
            ],
          },
        },
        subscription_type_invalid: {
          summary: 'Subscription type must be a string',
          value: {
            errorsMessages: [
              {
                message: 'Subscription type must be a string',
                field: 'subscriptionType',
              },
            ],
          },
        },
        payment_provider_required: {
          summary: 'Payment provider is required',
          value: {
            errorsMessages: [
              {
                message: 'Payment provider is required',
                field: 'paymentProvider',
              },
            ],
          },
        },
        payment_provider_invalid: {
          summary: 'Payment provider must be a string',
          value: {
            errorsMessages: [
              {
                message: 'Payment provider must be a string',
                field: 'paymentProvider',
              },
            ],
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

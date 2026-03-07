import { InputCreateSubscriptionPaymentUrlDto } from '@payments/modules/subscriptions/subscription-payments/api/dto/input/input-create-subscription-payment-url.dto';
import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiCreateSubscriptionPayment() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Create subscription payment URL',
      description:
        'Internal endpoint for creating a Stripe payment URL for subscription.',
      operationId: 'createSubscriptionPaymentUrl',
    }),
    ApiBody({
      type: InputCreateSubscriptionPaymentUrlDto,
      description: 'Subscription payment creation payload',
    }),
    ApiResponse({
      status: 200,
      description: 'Payment URL created successfully',
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
                field: 'userId',
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
          summary: 'Profile ID must be a numeric string',
          value: {
            errorsMessages: [
              {
                message: 'Profile ID must be a numeric string',
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
  );
}

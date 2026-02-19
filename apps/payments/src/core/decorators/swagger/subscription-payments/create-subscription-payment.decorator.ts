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
      description: 'Subscription payment creation payload',
      schema: {
        type: 'object',
        properties: {
          userId: {
            type: 'number',
            description: 'User ID',
            example: 123,
          },
          priceId: {
            type: 'string',
            description: 'Stripe price ID',
            example: 'price_1234567890',
          },
          successUrl: {
            type: 'string',
            description: 'Success redirect URL',
            example: 'https://example.com/success',
          },
          cancelUrl: {
            type: 'string',
            description: 'Cancel redirect URL',
            example: 'https://example.com/cancel',
          },
        },
        required: ['userId', 'priceId'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Payment URL created successfully',
      schema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Stripe payment URL',
            example: 'https://checkout.stripe.com/pay/cs_test_...',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        invalid_user: {
          summary: 'Invalid user',
          value: {
            errorsMessages: [
              {
                message: 'User does not exist',
                field: 'userId',
              },
            ],
          },
        },
      },
    }),
  );
}

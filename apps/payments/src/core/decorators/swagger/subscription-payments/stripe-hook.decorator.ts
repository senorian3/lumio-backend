import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiHeaders } from '@nestjs/swagger';

export function ApiStripeHook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Stripe webhook handler',
      description:
        'Endpoint for receiving Stripe webhook events (payment succeeded, subscription updated, etc.).',
      operationId: 'stripeHook',
    }),
    ApiHeaders([
      {
        name: 'stripe-signature',
        description: 'Stripe webhook signature',
        required: true,
      },
    ]),
    ApiResponse({
      status: 200,
      description: 'Webhook received successfully',
      schema: {
        type: 'object',
        properties: {
          received: {
            type: 'boolean',
            example: true,
          },
        },
      },
    }),
  );
}

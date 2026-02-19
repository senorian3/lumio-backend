import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiPaymentError() {
  return applyDecorators(
    ApiOperation({
      summary: 'Payment error redirect',
      description: 'Redirect URL for failed payment.',
      operationId: 'paymentError',
    }),
    ApiResponse({
      status: 200,
      description: 'Error message',
      schema: {
        type: 'string',
        example: 'Error url',
      },
    }),
  );
}

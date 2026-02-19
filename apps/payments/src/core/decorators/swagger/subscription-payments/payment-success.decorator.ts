import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiPaymentSuccess() {
  return applyDecorators(
    ApiOperation({
      summary: 'Payment success redirect',
      description: 'Redirect URL for successful payment.',
      operationId: 'paymentSuccess',
    }),
    ApiResponse({
      status: 200,
      description: 'Success message',
      schema: {
        type: 'string',
        example: 'Success url',
      },
    }),
  );
}

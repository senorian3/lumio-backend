import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiDeleteAllTestingData() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete all payments test data',
      description:
        'Endpoint for clearing Stripe customers and payments service test data. Intended for test environments only.',
      operationId: 'deleteAllPaymentsTestingData',
    }),
    ApiResponse({
      status: 204,
      description: 'Payments test data successfully deleted',
    }),
    ApiResponse({
      status: 500,
      description: 'Failed to delete payments test data',
    }),
  );
}

import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiDeleteAllData() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete all test data',
      description:
        'Endpoint for clearing all test data in Lumio, Files and Payments services. Intended for test environments only.',
      operationId: 'deleteAllTestingData',
    }),

    ApiResponse({
      status: 204,
      description: 'All test data successfully deleted',
    }),

    ApiResponse({
      status: 500,
      description:
        'Failed to delete all data in Lumio, Files or Payments service',
      examples: {
        files_delete_failed: {
          summary: 'Files service cleanup failed',
          value: {
            message: 'Failed to delete all data in files',
          },
        },
        payments_delete_failed: {
          summary: 'Payments service cleanup failed',
          value: {
            message: 'Failed to delete all data in payments',
          },
        },
        lumio_delete_failed: {
          summary: 'Lumio cleanup failed',
          value: {
            message: 'Failed to delete all data in lumio',
          },
        },
      },
    }),
  );
}

import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

export function ApiDeleteAllTestingData() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Delete all testing data',
      description:
        'Removes all uploaded files and database records used by files service tests.',
      operationId: 'deleteAllFilesTestingData',
    }),
    ApiResponse({
      status: 204,
      description: 'Testing data successfully deleted',
    }),
  );
}

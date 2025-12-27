import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetMainPage() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get main page information',
      description: 'Endpoint for get main page information',
      operationId: 'getMainPage',
    }),

    ApiResponse({
      status: 200,
      description: 'Main page information successfully fetched',
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        files_not_found: {
          summary: 'Failed to fetch files',
          value: {
            errorMessages: [
              {
                message: 'Failed to fetch files',
                field: 'files',
              },
            ],
          },
        },
      },
    }),
  );
}

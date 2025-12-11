import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RegistrationConfirmationInputDto } from '@lumio/modules/user-accounts/users/api/dto/input/registration-confirmation.input-dto';

export function ApiRegistrationConfirmation() {
  return applyDecorators(
    ApiOperation({
      summary: 'User confirmation email',
      description: 'Endpoint for email confirmation after registration',
      operationId: 'confirmationEmail',
    }),

    ApiBody({
      type: RegistrationConfirmationInputDto,
      description: 'Confirmation code payload',
    }),

    ApiResponse({
      status: 204,
      description: 'Email successfully confirmed',
    }),

    ApiResponse({
      status: 400,
      description: 'Invalid confirmation code',
      examples: {
        code_not_found: {
          summary: 'Confirmation code not found',
          value: {
            errorMessages: [
              {
                message: 'Confirmation code not found',
                field: 'confirmationCode',
              },
            ],
          },
        },
        code_already_used: {
          summary: 'Confirmation code already used',
          value: {
            errorMessages: [
              {
                message: 'Confirmation code already used',
                field: 'confirmationCode',
              },
            ],
          },
        },
        code_expired: {
          summary: 'Confirmation code expired',
          value: {
            errorMessages: [
              {
                message: 'Confirmation code expired',
                field: 'confirmationCode',
              },
            ],
          },
        },
      },
    }),
  );
}

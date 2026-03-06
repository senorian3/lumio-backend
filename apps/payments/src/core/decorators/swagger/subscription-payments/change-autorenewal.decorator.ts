import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { InputChangeAutorenewalSubscriptionPaymentDto } from '@payments/modules/subscriptions/subscription-payments/api/dto/input/input-update-autorenewal.dto';

export function ApiChangeAutorenewal() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Change subscription auto-renewal',
      description:
        'Internal endpoint for enabling or disabling subscription auto-renewal.',
      operationId: 'changeAutorenewal',
    }),
    ApiBody({
      type: InputChangeAutorenewalSubscriptionPaymentDto,
      description: 'Auto-renewal change payload',
    }),
    ApiResponse({
      status: 200,
      description: 'Auto-renewal changed successfully',
      examples: {
        autorenewal_updated: {
          summary: 'Auto-renewal status successfully updated',
          value: {},
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request (e.g., invalid data)',
      examples: {
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
          summary: 'Profile ID must be a string',
          value: {
            errorsMessages: [
              {
                message: 'Profile ID must be a string',
                field: 'profileId',
              },
            ],
          },
        },
        auto_renewal_required: {
          summary: 'Auto-renewal is required',
          value: {
            errorsMessages: [
              {
                message: 'Auto-renewal is required',
                field: 'autoRenewal',
              },
            ],
          },
        },
        auto_renewal_invalid: {
          summary: 'Auto-renewal must be a boolean value',
          value: {
            errorsMessages: [
              {
                message: 'Auto-renewal must be a boolean value',
                field: 'autoRenewal',
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found',
      examples: {
        profile_not_found: {
          summary: 'Profile does not exist',
          value: {
            errorsMessages: [
              {
                message: 'Profile does not exist',
                field: 'profileId',
              },
            ],
          },
        },
        no_active_subscription: {
          summary: 'User has no active subscription',
          value: {
            errorsMessages: [
              {
                message: "User doesn't have active subscription",
                field: 'profileId',
              },
            ],
          },
        },
      },
    }),
  );
}

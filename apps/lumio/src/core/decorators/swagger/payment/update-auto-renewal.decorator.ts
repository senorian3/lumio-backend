import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { InputChangeAutorenewalSubscriptionDto } from '@libs/dto/input/change-autorenewal-subscription.input.dto';

export function ApiUpdateAutoRenewal() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update subscription auto-renewal status',
      description:
        "Updates the auto-renewal status for the current authorized user's subscription",
      operationId: 'updateAutoRenewal',
    }),
    ApiBody({
      type: InputChangeAutorenewalSubscriptionDto,
      description: 'Data for updating auto-renewal status',
    }),
    ApiResponse({
      status: 200,
      description: 'Auto-renewal status successfully updated',
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
            errorMessages: [
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
            errorMessages: [
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
            errorMessages: [
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
            errorMessages: [
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
      status: 401,
      description: 'Unauthorized',
      examples: {
        invalid_session: {
          summary: 'Invalid session or JWT',
          value: {
            errorMessages: [
              {
                message: "User doesn't have active session",
                field: 'session',
              },
            ],
          },
        },
        invalid_token: {
          summary: 'Token is invalid',
          value: {
            errorMessages: [
              {
                message: 'Invalid user data in JWT',
                field: 'user',
              },
            ],
          },
        },
      },
    }),

    ApiResponse({
      status: 403,
      description: 'Forbidden',
      examples: {
        user_has_no_profile: {
          summary: 'User has no profile',
          value: {
            errorMessages: [
              {
                message: 'User has no profile',
                field: 'userId',
              },
            ],
          },
        },
        cannot_change_another_user: {
          summary: 'User cannot change autorenewal for another user',
          value: {
            errorMessages: [
              {
                message: 'User cannot change autorenewal for another user',
                field: 'profileId',
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
            errorMessages: [
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
            errorMessages: [
              {
                message: 'User has no active subscription',
                field: 'profileId',
              },
            ],
          },
        },
      },
    }),

    ApiResponse({
      status: 429,
      description: 'Too many requests',
      examples: {
        too_many_requests: {
          summary: 'Request limit exceeded',
          value: {
            errorMessages: [
              {
                message: 'Too many requests',
              },
            ],
          },
        },
      },
    }),
  );
}

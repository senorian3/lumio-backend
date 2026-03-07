import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiDeleteSessionByDeviceId() {
  return applyDecorators(
    ApiSecurity('refreshToken'),
    ApiOperation({
      summary: 'Delete user session by deviceId',
      description:
        'Endpoint to terminate a specific session associated with the authenticated user, identified by deviceId',
      operationId: 'deleteUserSessionByDeviceId',
    }),

    ApiParam({
      name: 'deviceId',
      required: true,
      description: 'Unique identifier of the device session to be terminated',
      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }),

    ApiResponse({
      status: 204,
      description: 'Session successfully deleted',
    }),

    ApiResponse({
      status: 401,
      description: 'Unauthorized - invalid or missing refresh token',
      examples: {
        no_refresh_token: {
          summary: 'No refresh token in request',
          value: {
            errorsMessages: [
              {
                message: 'There is no refresh token in request',
                field: 'refreshToken',
              },
            ],
          },
        },
        session_not_found: {
          summary: 'Session not found for device (from JWT)',
          value: {
            errorsMessages: [
              {
                message: "User doesn't have session",
                field: 'deviceId',
              },
            ],
          },
        },
        session_mismatch: {
          summary: 'Session data mismatch (user, device or expiry)',
          value: {
            errorsMessages: [
              {
                message: "User doesn't have session",
                field: 'session',
              },
            ],
          },
        },
      },
    }),

    ApiResponse({
      status: 403,
      description: 'Forbidden access',
      examples: {
        foreign_session: {
          summary: 'Attempt to terminate someone else’s session',
          value: {
            errorsMessages: [
              {
                message: "You can't terminate someone else's session!",
                field: 'session',
              },
            ],
          },
        },
        current_session: {
          summary: 'Attempt to terminate your current session',
          value: {
            errorsMessages: [
              {
                message: "You can't terminate your current session!",
                field: 'session',
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
        device_not_found: {
          summary: 'Device not found by paramDeviceId',
          value: {
            errorsMessages: [
              {
                message: 'Device is not found',
                field: 'deviceId',
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
          summary: 'Too many requests',
          value: {
            errorsMessages: [
              {
                message: 'Too many requests',
                field: null,
              },
            ],
          },
        },
      },
    }),
  );
}

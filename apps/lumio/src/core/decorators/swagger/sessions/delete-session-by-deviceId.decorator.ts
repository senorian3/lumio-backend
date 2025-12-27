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
      example: {
        deviceId: 'deviceId',
      },
    }),

    ApiResponse({
      status: 204,
      description: 'Session successfully deleted',
    }),

    ApiResponse({
      status: 401,
      description: 'Unauthorized',
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
          summary: 'Session not found for device',
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
          summary: 'Session mismatch',
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
  );
}

import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { ChatFileType } from '@files/modules/chat-files/api/dto/input/upload-chat-file.input.dto';

export function ApiUploadChatFile() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Upload chat file',
      description:
        'Internal endpoint for uploading a file attached to a chat message.',
      operationId: 'uploadChatFile',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Chat file upload payload',
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Chat file',
          },
          userId: {
            type: 'number',
            description: 'User ID who uploaded the file',
            example: 1,
          },
          chatId: {
            type: 'number',
            description: 'Chat ID',
            example: 123,
          },
          messageId: {
            type: 'string',
            description: 'Chat message ID',
            example: '01969ae5-d78d-4bae-b293-ab3370f3de8e',
          },
          fileType: {
            type: 'string',
            enum: Object.values(ChatFileType),
            description: 'Chat file type',
            example: ChatFileType.IMAGE,
          },
          text: {
            type: 'string',
            description: 'Optional text for media message',
            example: 'Look at this',
          },
          duration: {
            type: 'number',
            description: 'Optional media duration in seconds',
            example: 12,
          },
          width: {
            type: 'number',
            description: 'Optional image/video width',
            example: 1280,
          },
          height: {
            type: 'number',
            description: 'Optional image/video height',
            example: 720,
          },
        },
        required: ['file', 'userId', 'chatId', 'messageId', 'fileType'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Chat file successfully uploaded',
      schema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            example: 'content/chats/123/123_image_1.png',
          },
          url: {
            type: 'string',
            example:
              'https://lumio-files-photo.storage.yandexcloud.net/content/chats/123/123_image_1.png',
          },
          type: {
            type: 'string',
            enum: Object.values(ChatFileType),
            example: ChatFileType.IMAGE,
          },
          size: {
            type: 'number',
            example: 482391,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-02-19T21:17:16.278Z',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        file_required: {
          summary: 'File is required',
          value: {
            errorsMessages: [
              {
                message: 'File is required',
                field: 'file',
              },
            ],
          },
        },
        invalid_user_id: {
          summary: 'Invalid user ID',
          value: {
            errorsMessages: [
              {
                message: 'The "userId" must be a positive number',
                field: 'userId',
              },
            ],
          },
        },
        invalid_chat_id: {
          summary: 'Invalid chat ID',
          value: {
            errorsMessages: [
              {
                message: 'The "chatId" must be a positive number',
                field: 'chatId',
              },
            ],
          },
        },
        invalid_message_id: {
          summary: 'Invalid message ID',
          value: {
            errorsMessages: [
              {
                message: 'The "messageId" field cannot be empty',
                field: 'messageId',
              },
            ],
          },
        },
        invalid_file_type: {
          summary: 'Invalid file type',
          value: {
            errorsMessages: [
              {
                message:
                  'The "fileType" must be one of: IMAGE, VOICE, DOCUMENT',
                field: 'fileType',
              },
            ],
          },
        },
        upload_failed: {
          summary: 'Failed to upload file to S3',
          value: {
            errorsMessages: [
              {
                message: 'Failed to upload file to S3',
                field: 'file',
              },
            ],
          },
        },
      },
    }),
  );
}

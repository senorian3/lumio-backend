import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiHeader,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SendMessageInputDto } from '@chat/modules/chats/api/dto/input/send-message.input.dto';
import { SendMediaMessageInputDto } from '@chat/modules/chats/api/dto/input/send-media-message.input.dto';
import { GetChatMessagesInputDto } from '@chat/modules/chats/api/dto/input/get-chat-messages.input.dto';
import {
  chatErrorResponseSchema,
  internalApiUnauthorizedExample,
} from './chat-swagger.schemas';

export function ApiChatsController() {
  return applyDecorators(
    ApiTags('Chats'),
    ApiHeader({
      name: 'x-internal-api-key',
      description: 'Internal API key for service-to-service communication.',
      required: true,
    }),
    ApiHeader({
      name: 'x-internal-service',
      description: 'Internal caller service name.',
      required: true,
    }),
    ApiHeader({
      name: 'x-actor-user-id',
      description:
        'Trusted actor user ID propagated by the calling internal service.',
      required: true,
      schema: {
        type: 'integer',
        minimum: 1,
      },
    }),
    ApiUnauthorizedResponse({
      description:
        'Missing or invalid internal API key, or missing/invalid x-actor-user-id header.',
      schema: {
        ...chatErrorResponseSchema,
        example: internalApiUnauthorizedExample,
      },
    }),
    ApiExtraModels(
      SendMessageInputDto,
      SendMediaMessageInputDto,
      GetChatMessagesInputDto,
    ),
  );
}

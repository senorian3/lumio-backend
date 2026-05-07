import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ChatsController } from '@chat/modules/chats/api/chats.controller';
import { SendMessageCommand } from '@chat/modules/chats/application/commands/send-message.command-handler';
import { GetChatMessagesQuery } from '@chat/modules/chats/application/queries/get-chat-messages.query-handler';
import { MarkMessageReadCommand } from '@chat/modules/chats/application/commands/mark-message-read.command-handler';
import { SendMediaMessageCommand } from '@chat/modules/chats/application/commands/send-media-message.command-handler';
import { CoreConfig } from '@chat/core/core.config';

describe('ChatsController', () => {
  let controller: ChatsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let app: INestApplication;

  beforeEach(async () => {
    commandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

    queryBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<QueryBus>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatsController],
      providers: [
        {
          provide: CommandBus,
          useValue: commandBus,
        },
        {
          provide: QueryBus,
          useValue: queryBus,
        },
        {
          provide: CoreConfig,
          useValue: {
            internalApiKey: 'test-internal-key',
          },
        },
      ],
    }).compile();

    controller = module.get(ChatsController);
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('uses actor user id from trusted context instead of request body for sending a message', async () => {
    await controller.sendMessage(77, {
      recipientId: 12,
      message: 'hello',
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      new SendMessageCommand(77, 12, 'hello'),
    );
  });

  it('uses actor user id from trusted context when reading chat history', async () => {
    await controller.getChatMessages(77, {
      recipientId: 12,
      cursor: undefined,
      limit: 25,
    });

    expect(queryBus.execute).toHaveBeenCalledWith(
      new GetChatMessagesQuery(77, 12, undefined, 25),
    );
  });

  it('uses actor user id from trusted context when marking a message as read', async () => {
    await controller.markMessageAsRead('message-1', 77);

    expect(commandBus.execute).toHaveBeenCalledWith(
      new MarkMessageReadCommand('message-1', 77),
    );
  });

  it('uses actor user id from trusted context when sending a media message', async () => {
    const file = {
      originalname: 'image.png',
      mimetype: 'image/png',
      size: 1024,
    } as Express.Multer.File;

    await controller.sendMediaMessage(77, file, {
      recipientId: 12,
      type: 'IMAGE' as any,
      text: 'hello',
      width: 400,
      height: 300,
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      new SendMediaMessageCommand(77, 12, 'IMAGE' as any, file, 'hello', {
        duration: undefined,
        width: 400,
        height: 300,
      }),
    );
  });

  it('documents internal chat endpoints in swagger', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('CHAT API')
        .addSecurity('internal', {
          type: 'apiKey',
          name: 'x-internal-api-key',
          in: 'header',
        })
        .build(),
    );

    const sendMessageOperation = document.paths['/chats/send-message']?.post;
    const sendMediaMessageOperation =
      document.paths['/chats/send-media-message']?.post;
    const getMessagesOperation = document.paths['/chats/messages']?.get;
    const markReadOperation =
      document.paths['/chats/messages/{messageId}/read']?.post;
    const sendMessageParameters = (sendMessageOperation?.parameters ??
      []) as Array<{
      in?: string;
      name?: string;
      required?: boolean;
    }>;
    const getMessagesParameters = (getMessagesOperation?.parameters ??
      []) as Array<{
      in?: string;
      name?: string;
      required?: boolean;
    }>;
    const markReadParameters = (markReadOperation?.parameters ?? []) as Array<{
      in?: string;
      name?: string;
      required?: boolean;
    }>;

    expect(sendMessageOperation?.security).toEqual([{ internal: [] }]);
    expect(
      sendMessageParameters.some(
        (parameter) =>
          parameter.in === 'header' &&
          parameter.name === 'x-actor-user-id' &&
          parameter.required === true,
      ),
    ).toBe(true);
    expect(
      (sendMessageOperation?.requestBody as any)?.content?.['application/json'],
    ).toBeDefined();
    expect(sendMessageOperation?.responses?.['201']).toBeDefined();

    expect(sendMediaMessageOperation?.security).toEqual([{ internal: [] }]);
    expect(
      (sendMediaMessageOperation?.requestBody as any)?.content?.[
        'multipart/form-data'
      ],
    ).toBeDefined();
    expect(sendMediaMessageOperation?.responses?.['201']).toBeDefined();

    expect(
      getMessagesParameters.some(
        (parameter) =>
          parameter.in === 'query' && parameter.name === 'recipientId',
      ),
    ).toBe(true);
    expect(getMessagesOperation?.responses?.['200']).toBeDefined();
    expect(getMessagesOperation?.responses?.['404']).toBeDefined();

    expect(
      markReadParameters.some(
        (parameter) =>
          parameter.in === 'path' &&
          parameter.name === 'messageId' &&
          parameter.required === true,
      ),
    ).toBe(true);
    expect(markReadOperation?.responses?.['201']).toBeDefined();
  });

  it('keeps swagger decorators outside of the controller', () => {
    const controllerSource = readFileSync(
      join(
        process.cwd(),
        'apps/chat/src/modules/chats/api/chats.controller.ts',
      ),
      'utf8',
    );

    expect(controllerSource).not.toContain('@nestjs/swagger');
  });

  it('propagates errors from command bus when sending a message fails', async () => {
    commandBus.execute.mockRejectedValue(new Error('Command failed'));

    await expect(
      controller.sendMessage(77, {
        recipientId: 12,
        message: 'hello',
      }),
    ).rejects.toThrow('Command failed');
  });

  it('propagates errors from query bus when fetching messages fails', async () => {
    queryBus.execute.mockRejectedValue(new Error('Query failed'));

    await expect(
      controller.getChatMessages(77, {
        recipientId: 12,
        cursor: undefined,
        limit: 20,
      }),
    ).rejects.toThrow('Query failed');
  });

  it('propagates errors from command bus when marking a message as read fails', async () => {
    commandBus.execute.mockRejectedValue(new Error('Mark read failed'));

    await expect(controller.markMessageAsRead('message-1', 77)).rejects.toThrow(
      'Mark read failed',
    );
  });

  it('propagates errors from command bus when sending a media message fails', async () => {
    const file = {
      originalname: 'image.png',
      mimetype: 'image/png',
      size: 1024,
    } as Express.Multer.File;
    commandBus.execute.mockRejectedValue(new Error('Media send failed'));

    await expect(
      controller.sendMediaMessage(77, file, {
        recipientId: 12,
        type: 'IMAGE' as any,
      }),
    ).rejects.toThrow('Media send failed');
  });
});

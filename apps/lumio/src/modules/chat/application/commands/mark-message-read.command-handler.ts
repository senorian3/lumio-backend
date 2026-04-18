import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ChatHttpAdapter } from '@lumio/modules/chat/application/chat-http.adapter';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';

export class MarkMessageReadCommand {
  constructor(
    public readonly messageId: string,
    public readonly userId: number,
  ) {}
}

@CommandHandler(MarkMessageReadCommand)
export class MarkMessageReadCommandHandler implements ICommandHandler<MarkMessageReadCommand> {
  constructor(private readonly chatHttpAdapter: ChatHttpAdapter) {}

  async execute(command: MarkMessageReadCommand) {
    return this.chatHttpAdapter.markMessageAsRead(
      `${GLOBAL_PREFIX}/chats/messages`,
      command.messageId,
      command.userId,
    );
  }
}

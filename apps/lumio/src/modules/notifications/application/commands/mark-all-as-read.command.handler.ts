import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.repository';

export class MarkAllReadCommand {
  constructor(public readonly userId: number) {}
}

@CommandHandler(MarkAllReadCommand)
export class MarkAllReadCommandHandler implements ICommandHandler<
  MarkAllReadCommand,
  void
> {
  constructor(public readonly notificationRepository: NotificationRepository) {}

  async execute(command: MarkAllReadCommand): Promise<void> {
    await this.notificationRepository.markAllAsRead(command.userId);
  }
}

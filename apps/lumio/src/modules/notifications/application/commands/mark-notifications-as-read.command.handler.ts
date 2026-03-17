import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.repository';

export class MarkNotificationsAsReadCommand {
  constructor(
    public readonly userId: number,
    public readonly notificationIds: string[],
  ) {}
}

@CommandHandler(MarkNotificationsAsReadCommand)
export class MarkNotificationsAsReadCommandHandler implements ICommandHandler<
  MarkNotificationsAsReadCommand,
  void
> {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(command: MarkNotificationsAsReadCommand): Promise<void> {
    await this.notificationRepository.markNotificationsAsRead(
      command.userId,
      command.notificationIds,
    );
  }
}

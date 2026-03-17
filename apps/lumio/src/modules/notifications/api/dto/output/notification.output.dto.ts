import { ApiProperty } from '@nestjs/swagger';

export class NotificationViewDto {
  @ApiProperty({
    description: 'Unique notification identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Notification title (short description)',
    example: 'Подписка активирована',
    maxLength: 200,
    type: String,
  })
  title: string;

  @ApiProperty({
    description: 'Notification message (detailed information)',
    example: 'Ваша подписка активирована и действует до 14.04.2026',
    maxLength: 500,
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'Indicates whether the notification has been read',
    example: false,
    type: Boolean,
  })
  isRead: boolean;

  @ApiProperty({
    description:
      'Date and time when notification was created (ISO 8601 format)',
    example: '2026-03-14T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;
}

export class UnreadCountViewDto {
  @ApiProperty({
    description: 'Number of unread notifications',
    example: 5,
    type: Number,
  })
  unreadCount: number;
}

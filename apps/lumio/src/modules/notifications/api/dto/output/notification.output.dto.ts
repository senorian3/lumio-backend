import { ApiProperty } from '@nestjs/swagger';

export class NotificationViewDto {
  @ApiProperty({
    description: 'Unique notification identifier',
    example: '550',
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
    description:
      'Date and time when notification was created (ISO 8601 format)',
    example: '2026-03-14T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;
}

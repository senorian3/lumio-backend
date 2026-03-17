import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkNotificationsAsReadInputDto {
  @ApiProperty({
    description: 'Array of notification IDs to mark as read',
    example: [
      'a5107593-08c8-4669-8371-594fda24d71e',
      '5e3fc19c-97e9-45a1-995c-c5495298d481',
    ],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  notificationIds: string[];
}

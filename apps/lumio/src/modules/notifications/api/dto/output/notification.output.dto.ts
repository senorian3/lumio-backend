import { ApiProperty } from '@nestjs/swagger';

export class NotificationOutputDto {
  @ApiProperty({ example: '550' })
  id: string;

  @ApiProperty({ example: 'Подписка активирована ', maxLength: 200 })
  title: string;

  @ApiProperty({
    example: 'Ваш подписка активна и рабтает до....',
    maxLength: 500,
  })
  message: string;

  @ApiProperty({ example: '2024-03-12T10:30:00.000Z' })
  createdAt: Date;
}

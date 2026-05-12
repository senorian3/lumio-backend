import {
  IsNumber,
  IsNotEmpty,
  IsPositive,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@chat/modules/chats/domain/message-types.enum';
import { Trim } from '@libs/core/decorators/transform/trim';

export class SendMediaMessageInputDto {
  @ApiProperty({
    description: 'Recipient user ID',
    example: 12,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'The "recipientId" field must be a number' })
  @IsNotEmpty({ message: 'The "recipientId" field cannot be empty' })
  @IsPositive({ message: 'The "recipientId" must be a positive number' })
  recipientId: number;

  @ApiProperty({
    description: 'Media message type',
    enum: [MessageType.IMAGE, MessageType.VOICE],
    example: MessageType.IMAGE,
  })
  @IsIn([MessageType.IMAGE, MessageType.VOICE], {
    message: 'The "type" must be one of: IMAGE, VOICE',
  })
  @IsNotEmpty({ message: 'The "type" field cannot be empty' })
  type: MessageType;

  @ApiPropertyOptional({
    description: 'Optional caption for IMAGE messages only.',
    example: 'Look at this',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'The "text" field must be a string' })
  @Trim()
  @MaxLength(500, { message: 'The text must not exceed 500 characters' })
  text?: string;

  @ApiPropertyOptional({
    description: 'Image width in pixels. Allowed for IMAGE messages only.',
    example: 1080,
    minimum: 1,
  })
  @ValidateIf((o) => o.type === MessageType.IMAGE)
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'The "width" field must be a number' })
  @IsPositive({ message: 'The "width" must be a positive number' })
  width?: number;

  @ApiPropertyOptional({
    description: 'Image height in pixels. Allowed for IMAGE messages only.',
    example: 720,
    minimum: 1,
  })
  @ValidateIf((o) => o.type === MessageType.IMAGE)
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'The "height" field must be a number' })
  @IsPositive({ message: 'The "height" must be a positive number' })
  height?: number;

  @ApiPropertyOptional({
    description:
      'Voice message duration in seconds. Allowed for VOICE messages only.',
    example: 17,
    minimum: 1,
  })
  @ValidateIf((o) => o.type === MessageType.VOICE)
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'The "duration" field must be a number' })
  @IsPositive({ message: 'The "duration" must be a positive number' })
  duration?: number; // in seconds
}

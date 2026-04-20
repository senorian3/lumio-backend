import {
  IsNumber,
  IsNotEmpty,
  IsPositive,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '@chat/modules/chats/domain/message-types.enum';

export class SendMediaMessageInputDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'The "userId" field must be a number' })
  @IsNotEmpty({ message: 'The "userId" field cannot be empty' })
  @IsPositive({ message: 'The "userId" must be a positive number' })
  userId: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'The "recipientId" field must be a number' })
  @IsNotEmpty({ message: 'The "recipientId" field cannot be empty' })
  @IsPositive({ message: 'The "recipientId" must be a positive number' })
  recipientId: number;

  @IsEnum(MessageType, { message: 'Invalid message type' })
  @IsNotEmpty({ message: 'The "type" field cannot be empty' })
  type: MessageType;

  @IsOptional()
  @IsString({ message: 'The "text" field must be a string' })
  @MaxLength(500, { message: 'The text must not exceed 500 characters' })
  text?: string;

  // File metadata (will be populated from uploaded file)
  @IsOptional()
  @IsString({ message: 'The "fileName" field must be a string' })
  fileName?: string;

  @IsOptional()
  @IsString({ message: 'The "mimeType" field must be a string' })
  mimeType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'The "fileSize" field must be a number' })
  @IsPositive({ message: 'The "fileSize" must be a positive number' })
  fileSize?: number;

  // Image specific metadata
  @ValidateIf((o) => o.type === MessageType.IMAGE)
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'The "width" field must be a number' })
  @IsPositive({ message: 'The "width" must be a positive number' })
  width?: number;

  @ValidateIf((o) => o.type === MessageType.IMAGE)
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'The "height" field must be a number' })
  @IsPositive({ message: 'The "height" must be a positive number' })
  height?: number;

  // Voice specific metadata
  @ValidateIf((o) => o.type === MessageType.VOICE)
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'The "duration" field must be a number' })
  @IsPositive({ message: 'The "duration" must be a positive number' })
  duration?: number; // in seconds
}

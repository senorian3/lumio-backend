import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InternalApiGuard } from '@files/core/guards/internal/internal-api.guard';
import { CommandBus } from '@nestjs/cqrs';
import { UploadUserAvatarCommand } from '@files/modules/profile/application/commands/upload-user-avatar.command-handler';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('profile')
@UseGuards(InternalApiGuard)
export class ProfileController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('/upload-user-avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadUserAvatar(
    @UploadedFile() avatar: Express.Multer.File,
    @Body('userId') userId: string,
  ) {
    if (!avatar) {
      throw new BadRequestException('Avatar file is required');
    }

    const fileInput = {
      buffer: avatar.buffer,
      originalname: avatar.originalname,
    };

    const uploadUserAvatarUrl = await this.commandBus.execute<
      UploadUserAvatarCommand,
      string
    >(new UploadUserAvatarCommand(+userId, [fileInput]));

    return { url: uploadUserAvatarUrl };
  }
}

import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InternalApiGuard } from '@files/core/guards/internal/internal-api.guard';
import { CommandBus } from '@nestjs/cqrs';
import { UploadUserAvatarCommand } from '@files/modules/avatar/application/commands/upload-user-avatar.command-handler';
import { DeleteUserAvatarCommand } from '@files/modules/avatar/application/commands/delete-user-avatar.command-handler';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  AVATAR_FILES_BASE,
  AVATAR_FILES_ROUTES,
} from '@files/core/routes/avatar-files-routes';

@Controller(AVATAR_FILES_BASE)
@UseGuards(InternalApiGuard)
export class AvatarController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(AVATAR_FILES_ROUTES.UPLOAD_USER_AVATAR_FILE)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadUserAvatar(
    @UploadedFile() avatar: Express.Multer.File,
    @Body('userId') userId: string,
  ): Promise<{ url: string }> {
    return {
      url: await this.commandBus.execute<UploadUserAvatarCommand, string>(
        new UploadUserAvatarCommand(+userId, avatar),
      ),
    };
  }

  @Delete(AVATAR_FILES_ROUTES.DELETE_USER_AVATAR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserAvatar(@Param('userId') userId: string): Promise<void> {
    await this.commandBus.execute(new DeleteUserAvatarCommand(+userId));
  }
}

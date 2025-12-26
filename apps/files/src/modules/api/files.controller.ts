import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InternalApiGuard } from '@files/core/guards/internal/internal-api.guard';
import { InputUploadFilesType } from './dto/upload-files.input.dto';
import { PostFileEntity } from '../domain/entities/post-file.entity';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GetAllFilesByPostUserQuery } from '@files/modules/application/queries/get-all-files-by-post.query-handler';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import { UploadFilesCreatedPostCommand } from '@files/modules/application/use-cases/upload-post-file.usecase';
import { DeletedPostFileCommand } from '@files/modules/application/use-cases/deleted-post-file.usecase';
import { GetUserPostsDto } from '@files/api/dto/input/get-user-post.input-dto';
import { AppLoggerService } from '@libs/logger/logger.service';

@Controller('files')
@UseGuards(InternalApiGuard)
export class FilesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: AppLoggerService,
  ) {}

  @Post('upload-post-files')
  @UseInterceptors(FilesInterceptor('files'))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async uploadPostFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() dto: InputUploadFilesType,
  ): Promise<OutputFileType[]> {
    await this.commandBus.execute<
      UploadFilesCreatedPostCommand,
      PostFileEntity[]
    >(new UploadFilesCreatedPostCommand(+dto.postId, files));

    const filesMap = await this.queryBus.execute<
      GetAllFilesByPostUserQuery,
      OutputFileType[]
    >(new GetAllFilesByPostUserQuery(+dto.postId));

    return filesMap;
  }

  @Delete('delete-post-files/:postId')
  async handlePostDeleted(@Param('postId') postId: number): Promise<boolean> {
    try {
      await this.commandBus.execute<DeletedPostFileCommand, void>(
        new DeletedPostFileCommand(postId),
      );
      return true;
    } catch (error) {
      this.logger.error(
        'Failed to delete post files',
        error?.stack,
        FilesController.name,
      );
      return false;
    }
  }

  @Post()
  async handleGetUserPosts(
    @Body()
    data: GetUserPostsDto,
  ): Promise<OutputFileType[]> {
    const allFiles: OutputFileType[] = [];
    for (const postId of data.postIds) {
      const files = await this.queryBus.execute<
        GetAllFilesByPostUserQuery,
        OutputFileType[] | null
      >(new GetAllFilesByPostUserQuery(postId));
      if (files && files.length > 0) {
        allFiles.push(...files);
      }
    }
    return allFiles;
  }
}

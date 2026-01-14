import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InternalApiGuard } from '@files/core/guards/internal/internal-api.guard';
import { InputUploadFilesType } from './dto/input/upload-files.input.dto';
import { PostFileEntity } from '../domain/entities/post-file.entity';
import { FilesInterceptor } from '@nestjs/platform-express';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import { AppLoggerService } from '@libs/logger/logger.service';
import { GetAllFilesByPostUserQuery } from '../application/queries/get-all-files-by-post.query-handler';
import { DeletedPostFileCommand } from '../application/commands/deleted-post-file.command-handler';
import { UploadFilesCreatedPostCommand } from '../application/commands/upload-post-file.command-handler';
import { GetUserPostsDto } from './dto/input/get-user-post.input.dto';

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
  async deletePostFiles(@Param('postId') postId: number): Promise<boolean> {
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
  async getAllUserPostsFiles(
    @Body()
    data: GetUserPostsDto,
  ): Promise<OutputFileType[]> {
    const allFiles: OutputFileType[] = [];

    for (const postId of data.postIds) {
      const files = await this.queryBus.execute<
        GetAllFilesByPostUserQuery,
        OutputFileType[]
      >(new GetAllFilesByPostUserQuery(postId));

      if (files && files.length > 0) {
        allFiles.push(...files);
      }
    }
    return allFiles;
  }
}

import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InternalApiGuard } from '@files/core/guards/internal/internal-api.guard';
import { InputUploadFilesDto } from './dto/input/upload-files.input.dto';
import { PostFileEntity } from '../domain/entities/post-file.entity';
import { FilesInterceptor } from '@nestjs/platform-express';
import { OutputFileType } from '@libs/dto/output/file-output';
import { GetAllFilesByPostUserQuery } from '../application/queries/get-all-files-by-post.query-handler';
import { GetAllFilesByPostIdsQuery } from '../application/queries/get-all-files-by-post-ids.query-handler';
import { GetAllFilesByUserIdQuery } from '../application/queries/get-all-files-by-user-id.query-handler';
import { DeletedPostFilesCommand } from '../application/commands/deleted-post-files.command-handler';
import { UploadFilesCreatedPostCommand } from '../application/commands/upload-post-file.command-handler';
import { DeleteFileByKeyCommand } from '../application/commands/delete-file-by-key.command-handler';
import { InputGetUserPostsDto } from './dto/input/get-user-post.input.dto';
import {
  POST_FILES_BASE,
  POST_FILES_ROUTES,
} from '@files/core/routes/post-files-routes';
import { ApiGetPostFiles } from '@files/core/decorators/swagger/post-files/get-post-files.decorator';
import { ApiUploadPostFiles } from '@files/core/decorators/swagger/post-files/upload-post-files.decorator';
import { ApiDeletePostFiles } from '@files/core/decorators/swagger/post-files/delete-post-files.decorator';
import { ApiDeleteFileByKey } from '@files/core/decorators/swagger/post-files/delete-file-by-key.decorator';

@Controller(POST_FILES_BASE)
@UseGuards(InternalApiGuard)
export class PostFilesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiGetPostFiles()
  async getAllUserPostsFiles(
    @Body()
    data: InputGetUserPostsDto,
  ): Promise<OutputFileType[]> {
    return await this.queryBus.execute(
      new GetAllFilesByPostIdsQuery(data.postIds),
    );
  }

  @Post(POST_FILES_ROUTES.UPLOAD_POST_FILES)
  @ApiUploadPostFiles()
  @UseInterceptors(FilesInterceptor('files'))
  async uploadPostFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() dto: InputUploadFilesDto,
  ): Promise<OutputFileType[]> {
    await this.commandBus.execute<
      UploadFilesCreatedPostCommand,
      PostFileEntity[]
    >(new UploadFilesCreatedPostCommand(dto.postId, dto.userId, files));

    return await this.queryBus.execute<
      GetAllFilesByPostUserQuery,
      OutputFileType[]
    >(new GetAllFilesByPostUserQuery(dto.postId));
  }

  @Delete(POST_FILES_ROUTES.DELETE_POST_FILES)
  @ApiDeletePostFiles()
  async deletePostFiles(@Param('postId') postId: string): Promise<void> {
    return await this.commandBus.execute<DeletedPostFilesCommand, void>(
      new DeletedPostFilesCommand(postId),
    );
  }

  @Delete(POST_FILES_ROUTES.DELETE_FILE)
  @ApiDeleteFileByKey()
  async deleteFile(@Param('key') key: string): Promise<void> {
    return await this.commandBus.execute<DeleteFileByKeyCommand, void>(
      new DeleteFileByKeyCommand(key),
    );
  }

  @Get(POST_FILES_ROUTES.GET_USER_FILES)
  async getUserFiles(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<OutputFileType[]> {
    return await this.queryBus.execute(
      new GetAllFilesByUserIdQuery(userId, page, limit),
    );
  }
}

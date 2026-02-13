import {
  Body,
  Controller,
  Delete,
  Get,
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
import { GetAllFilesByPostUserQuery } from '../application/queries/get-all-files-by-post.query-handler';
import { GetAllFilesByPostIdsQuery } from '../application/queries/get-all-files-by-post-ids.query-handler';
import { DeletedPostFileCommand } from '../application/commands/deleted-post-file.command-handler';
import { UploadFilesCreatedPostCommand } from '../application/commands/upload-post-file.command-handler';
import { GetUserPostsDto } from './dto/input/get-user-post.input.dto';

@Controller('files')
@UseGuards(InternalApiGuard)
export class PostFilesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getAllUserPostsFiles(
    @Body()
    data: GetUserPostsDto,
  ): Promise<OutputFileType[]> {
    return await this.queryBus.execute(
      new GetAllFilesByPostIdsQuery(data.postIds),
    );
  }

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

    return await this.queryBus.execute<
      GetAllFilesByPostUserQuery,
      OutputFileType[]
    >(new GetAllFilesByPostUserQuery(+dto.postId));
  }

  @Delete('delete-post-files/:postId')
  async deletePostFiles(@Param('postId') postId: number): Promise<void> {
    return await this.commandBus.execute<DeletedPostFileCommand, void>(
      new DeletedPostFileCommand(postId),
    );
  }
}

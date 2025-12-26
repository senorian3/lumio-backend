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

@Controller('files')
export class FilesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('upload-post-files')
  @UseInterceptors(FilesInterceptor('files'))
  @UseGuards(InternalApiGuard)
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

  // @MessagePattern(RABBITMQ_CONFIG.messagePatterns.POST_CREATED)
  // async handlePostCreated(
  //   @Payload() data: { postId: number; files: Array<Express.Multer.File> },
  //   @Ctx() context: RmqContext,
  // ): Promise<OutputFilesDto[]> {
  //   const channel = context.getChannelRef();
  //   const originalMsg = context.getMessage();
  //   try {
  //     await this.commandBus.execute<UploadFilesCreatedPostCommand, void>(
  //       new UploadFilesCreatedPostCommand(data.postId, data.files),
  //     );

  //     const result = await this.queryBus.execute<
  //       GetAllFilesByPostUserQuery,
  //       OutputFilesDto[] | null
  //     >(new GetAllFilesByPostUserQuery(data.postId));

  //     channel.ack(originalMsg);
  //     return result || [];
  //   } catch (error) {
  //     channel.nack(originalMsg);
  //     throw error;
  //   }
  // }

  @Delete('delete-post-files/:postId')
  async handlePostDeleted(@Param('postId') postId: number): Promise<boolean> {
    try {
      await this.commandBus.execute<DeletedPostFileCommand, void>(
        new DeletedPostFileCommand(postId),
      );
      return true;
    } catch (error) {
      console.error('Failed to delete post files:', error);
      return false;
    }
  }

  @Post()
  async handleGetUserPosts(
    @Body() data: GetUserPostsDto,
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

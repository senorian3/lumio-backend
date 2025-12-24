import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UploadFilesCreatedPostCommand } from '@files/application/use-cases/upload-post-file.usecase';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from '@libs/core/pipe/validation/validation-file.pipe';
import { DeletedPostFileCommand } from '@files/application/use-cases/deleted-post-file.usecase';
import { GetAllFilesByPostUserQuery } from '@files/application/queries/get-all-file-by-post.query-handler';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import { GetUserPostsDto } from '@files/api/dto/input/get-user-post.input-dto';

@Controller('files')
export class FilesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('upload-post-files')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async uploadPostFiles(
    @Req() req: any,
    @UploadedFiles(FileValidationPipe) files: Array<Express.Multer.File>,
  ): Promise<void> {
    return await this.commandBus.execute<UploadFilesCreatedPostCommand, void>(
      new UploadFilesCreatedPostCommand(files, req.user.userId),
    );
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

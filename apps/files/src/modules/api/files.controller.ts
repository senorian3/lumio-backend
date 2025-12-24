import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InternalApiGuard } from '@files/core/guards/internal/internal-api.guard';
import { UploadFilesCreatedPostCommand } from '../application/use-cases/upload-post-file.usecase';
import { InputUploadFilesType } from './dto/upload-files.input.dto';
import { PostFileEntity } from '../domain/entities/post-file.entity';

@Controller('files')
export class FilesController {
  constructor(private readonly commandBus: CommandBus) {}
  @Post('upload-post-files')
  @UseGuards(InternalApiGuard)
  async uploadPostFiles(
    @Body() dto: InputUploadFilesType,
  ): Promise<PostFileEntity[]> {
    console.log('POST ID IN CONTROLLER FILES', dto.postId);
    console.log('FILES IN CONTROLLER FILES', dto.files);
    const postFiles = await this.commandBus.execute<
      UploadFilesCreatedPostCommand,
      PostFileEntity[]
    >(new UploadFilesCreatedPostCommand(+dto.postId, dto.files));

    return postFiles;
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

  // @MessagePattern(RABBITMQ_CONFIG.messagePatterns.POST_DELETED)
  // async handlePostDeleted(
  //   @Payload() data: { postId: number },
  //   @Ctx() context: RmqContext,
  // ): Promise<void> {
  //   const channel = context.getChannelRef();
  //   const originalMsg = context.getMessage();
  //   try {
  //     await this.commandBus.execute<DeletedPostFileCommand, void>(
  //       new DeletedPostFileCommand(data.postId),
  //     );
  //     channel.ack(originalMsg);
  //   } catch (error) {
  //     channel.nack(originalMsg);
  //     throw error;
  //   }
  // }

  // @MessagePattern(RABBITMQ_CONFIG.messagePatterns.GET_USER_POSTS)
  // async handleGetUserPosts(
  //   @Payload() data: { postIds: number[] },
  //   @Ctx() context: RmqContext,
  // ): Promise<OutputFilesDto[]> {
  //   const channel = context.getChannelRef();
  //   const originalMsg = context.getMessage();
  //   try {
  //     const allFiles: OutputFilesDto[] = [];

  //     // Process each post ID to get all files
  //     for (const postId of data.postIds) {
  //       const files = await this.queryBus.execute<
  //         GetAllFilesByPostUserQuery,
  //         OutputFilesDto[] | null
  //       >(new GetAllFilesByPostUserQuery(postId));

  //       if (files && files.length > 0) {
  //         allFiles.push(...files);
  //       }
  //     }

  //     channel.ack(originalMsg);
  //     return allFiles;
  //   } catch (error) {
  //     channel.nack(originalMsg);
  //     throw error;
  //   }
  // }
}

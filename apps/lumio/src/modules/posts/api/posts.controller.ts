import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreatePostDto } from '@lumio/modules/posts/api/dto/input/create-post.input.dto';
import { FileValidationPipe } from '@lumio/core/pipe/validation/validation-file.pipe';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { CreatePostCommand } from '@lumio/modules/posts/application/use-case/create-post.usecase';
import { UpdatePostDto } from '@lumio/modules/posts/api/dto/input/update-post.input.dto';
import { UpdatePostCommand } from '@lumio/modules/posts/application/use-case/update-post.usecase';
import { OutputFilesDto } from '@libs/rabbitmq/dto/output';

@Controller('posts')
export class PostsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createPost(
    @UploadedFiles(FileValidationPipe)
    files: Array<Express.Multer.File>,
    @Body() dto: CreatePostDto,
    @Req() req: any,
  ) {
    console.log('=== POSTS CONTROLLER ===');
    console.log('userId:', req.user?.userId);
    console.log('files count:', files?.length);
    console.log('dto:', dto);
    const userId = req.user.userId;

    const result = await this.commandBus.execute<
      CreatePostCommand,
      { files: OutputFilesDto[]; postId: number }
    >(new CreatePostCommand(userId, files, dto));

    console.log('CommandBus result:', result);
    return result;
  }

  @Put('/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param('postId') postId: number,
    @Body() dto: UpdatePostDto,
    @Req() req: any,
  ): Promise<void> {
    const userId = +req.user.userId;

    await this.commandBus.execute<UpdatePostCommand, void>(
      new UpdatePostCommand(userId, +postId, dto.description),
    );
  }
}

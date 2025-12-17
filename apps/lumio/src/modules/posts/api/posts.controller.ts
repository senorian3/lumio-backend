import {
  Body,
  Controller,
  Post,
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
    const userId = req.user.userId;

    const postId = await this.commandBus.execute<CreatePostCommand, number>(
      new CreatePostCommand(userId, files, dto),
    );

    return postId;
  }
}

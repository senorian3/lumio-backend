import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePostCommand } from '@lumio/modules/posts/application/use-case/create-post.usecase';
import { UpdatePostDto } from '@lumio/modules/posts/api/dto/input/update-post.input.dto';
import { UpdatePostCommand } from '@lumio/modules/posts/application/use-case/update-post.usecase';
import { OutputFilesDto } from '@libs/rabbitmq/dto/output';
import { PostView } from '@lumio/modules/posts/api/dto/output/createPost.output';
import { GetAllUserPostsQuery } from '../application/query/get-all-user-posts.query-handler';
import { GetCreatePostUserQuery } from '../application/query/get-by-id-create-post.query-handler copy';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllUserPosts(@Req() req: any): Promise<any> {
    return await this.queryBus.execute<GetAllUserPostsQuery, any>(
      new GetAllUserPostsQuery(req.user.userId),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createPost(
    @UploadedFiles(FileValidationPipe)
    files: Array<Express.Multer.File>,
    @Body() dto: CreatePostDto,
    @Req() req: any,
  ): Promise<PostView> {
    const userId = req.user.userId;

    const result = await this.commandBus.execute<
      CreatePostCommand,
      { files: OutputFilesDto[]; postId: number }
    >(new CreatePostCommand(userId, files, dto));

    const mappedPost = await this.queryBus.execute<
      GetCreatePostUserQuery,
      PostView
    >(new GetCreatePostUserQuery(result.postId, result.files));

    return mappedPost;
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

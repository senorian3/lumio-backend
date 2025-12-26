import {
  Body,
  Controller,
  Delete,
  Get,
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
import { InputCreatePostType } from '@lumio/modules/posts/api/dto/input/create-post.input.dto';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { CreatePostCommand } from '@lumio/modules/posts/application/use-case/create-post.usecase';
import { UpdatePostCommand } from '@lumio/modules/posts/application/use-case/update-post.usecase';
import { PostView } from '@lumio/modules/posts/api/dto/output/create-post.output';
import { InputUpdatePostType } from './dto/input/update-post.input.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from '@libs/core/pipe/validation/validation-file.pipe';
import { GetCreatePostUserQuery } from '@lumio/modules/posts/application/query/get-by-id-create-post.query-handler copy';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DeletePostCommand } from '@lumio/modules/posts/application/use-case/delete-post.usecase';
import { GetPostsQueryParams } from '@lumio/modules/posts/api/dto/input/get-all-user-posts.query.dto';
import { GetAllUserPostsQuery } from '@lumio/modules/posts/application/query/get-all-user-posts.query-handler';
import { ApiCreatePost } from '@lumio/core/decorators/swagger/create-post.decorator';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getAllUserPosts(
    @Query()
    query: GetPostsQueryParams,
    @Req() req: any,
  ): Promise<number> {
    return await this.queryBus.execute<GetAllUserPostsQuery, any>(
      new GetAllUserPostsQuery(req.user.userId, query),
    );
  }

  @Post()
  @ApiCreatePost()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createPost(
    @Req() req: any,
    @UploadedFiles(FileValidationPipe) files: Array<Express.Multer.File>,
    @Body() dto: InputCreatePostType,
  ): Promise<PostView> {
    const postFile = await this.commandBus.execute<
      CreatePostCommand,
      { file: OutputFileType[]; postId: number }
    >(new CreatePostCommand(req.user.userId, dto.description, files));

    const post = await this.queryBus.execute<GetCreatePostUserQuery, PostView>(
      new GetCreatePostUserQuery(postFile.postId, postFile.file),
    );

    return post;
  }

  @Put(':postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param('postId') postId: number,
    @Body() dto: InputUpdatePostType,
    @Req() req: any,
  ): Promise<PostView> {
    const updatedPost = await this.commandBus.execute<
      UpdatePostCommand,
      PostView
    >(new UpdatePostCommand(postId, req.user.userId, dto.description));

    return updatedPost;
  }

  @Delete(':postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @Param('postId') postId: number,
    @Req() req: any,
  ): Promise<void> {
    const userId = req.user.userId;
    await this.commandBus.execute<DeletePostCommand, void>(
      new DeletePostCommand(userId, postId),
    );
  }
}

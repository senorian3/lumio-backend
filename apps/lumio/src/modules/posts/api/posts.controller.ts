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
} from '@nestjs/common';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { CreatePostCommand } from '@lumio/modules/posts/application/use-case/command/create-post.usecase';
import { UpdatePostCommand } from '@lumio/modules/posts/application/use-case/command/update-post.usecase';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from '@libs/core/pipe/validation/validation-file.pipe';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DeletePostCommand } from '@lumio/modules/posts/application/use-case/command/delete-post.usecase';
import { GetPostsQueryParams } from '@lumio/modules/posts/api/dto/input/get-all-user-posts.query.dto';
import { ApiCreatePost } from '@lumio/core/decorators/swagger/create-post.decorator';
import { InputUpdatePostDto } from './dto/input/update-post.input.dto';
import { PostView } from './dto/output/create-post.output.dto';
import { GetAllUserPostsCommand } from '../application/use-case/query/get-all-user-posts.usecase';
import { GetCreatePostUserCommand } from '../application/use-case/query/get-by-id-create-post.usecase';
import { ApiUpdatePost } from '@lumio/core/decorators/swagger/update-post.decorator';
import { ApiDeletePost } from '@lumio/core/decorators/swagger/delete-post.decorator';
import { ApiGetMyPosts } from '@lumio/core/decorators/swagger/get-my-posts.decorator';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('my')
  @ApiGetMyPosts()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getAllUserPosts(
    @Query()
    query: GetPostsQueryParams,
    @Req() req: any,
  ): Promise<number> {
    return await this.queryBus.execute<GetAllUserPostsCommand, number>(
      new GetAllUserPostsCommand(req.user.userId, query),
    );
  }

  @Post()
  @ApiCreatePost()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  async createPost(
    @Req() req: any,
    @UploadedFiles(FileValidationPipe) files: Array<Express.Multer.File>,
    @Body() dto: InputUpdatePostDto,
  ): Promise<PostView> {
    const postFile = await this.commandBus.execute<
      CreatePostCommand,
      { file: OutputFileType[]; postId: number }
    >(new CreatePostCommand(req.user.userId, dto.description, files));

    const post = await this.queryBus.execute<
      GetCreatePostUserCommand,
      PostView
    >(new GetCreatePostUserCommand(postFile.postId, postFile.file));

    return post;
  }

  @Put(':postId')
  @ApiUpdatePost()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param('postId') postId: number,
    @Body() dto: InputUpdatePostDto,
    @Req() req: any,
  ): Promise<PostView> {
    const updatedPost = await this.commandBus.execute<
      UpdatePostCommand,
      PostView
    >(new UpdatePostCommand(postId, req.user.userId, dto.description));

    return updatedPost;
  }

  @Delete(':postId')
  @ApiDeletePost()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @Param('postId') postId: number,
    @Req() req: any,
  ): Promise<void> {
    return await this.commandBus.execute<DeletePostCommand, void>(
      new DeletePostCommand(req.user.userId, postId),
    );
  }
}

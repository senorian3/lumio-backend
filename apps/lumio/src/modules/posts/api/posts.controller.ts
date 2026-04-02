import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserId } from '@lumio/core/decorators/user-id.decorator';
import { OptionalUserId } from '@lumio/core/decorators/optional-user-id.decorator';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CreatePostCommand } from '@lumio/modules/posts/application/commands/create-post.command-handler';
import { UpdatePostCommand } from '@lumio/modules/posts/application/commands/update-post.command-handler';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from '@libs/core/pipe/validation/validation-files.pipe';
import { OutputFileType } from '@libs/dto/output/file-output';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DeletePostCommand } from '@lumio/modules/posts/application/commands/delete-post.command-handler';
import { GetPostsQueryParams } from '@lumio/modules/posts/api/dto/input/get-all-user-posts.query.dto';
import { ApiCreatePost } from '@lumio/core/decorators/swagger/posts/create-post.decorator';
import { InputUpdatePostDto } from './dto/input/update-post.input.dto';
import { PostView } from './dto/output/post.output.dto';
import { ApiUpdatePost } from '@lumio/core/decorators/swagger/posts/update-post.decorator';
import { ApiDeletePost } from '@lumio/core/decorators/swagger/posts/delete-post.decorator';
import { ApiGetUserPosts } from '@lumio/core/decorators/swagger/posts/get-my-posts.decorator';
import { InputCreatePostDto } from './dto/input/create-post.input.dto';
import { GetAllUserPostsQuery } from '@lumio/modules/posts/application/queries/get-all-user-posts.query-handler';
import { GetCreatePostUserQuery } from '@lumio/modules/posts/application/queries/get-by-id-create-post.query-handler';
import { POST_BASE } from '@lumio/core/routes/post-routes';
import { GetProfilePostQuery } from '../application/queries/get-profile-post.query-handler';
import { ApiGetProfilePost } from '@lumio/core/decorators/swagger/posts/get-profile-post.decorator';
import { GetPostByIdQuery } from '@lumio/modules/posts/application/queries/get-post-by-id.query-handler';
import { ApiGetPostById } from '@lumio/core/decorators/swagger/posts/get-post-by-post-id.decorator';
import { OptionalJwtAuthGuard } from '@lumio/core/guards/bearer/jwt-optional-auth.guard';
import { PaginatedPostViewDto } from '@lumio/modules/posts/api/dto/output/posts.paginated.view-dto';

@UseGuards(ThrottlerGuard)
@Controller(POST_BASE)
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':userId')
  @ApiGetUserPosts()
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  async getAllUserPosts(
    @Param('userId') userId: number,
    @Query()
    query: GetPostsQueryParams,
    @OptionalUserId() currentUserId: number | null,
  ): Promise<PaginatedPostViewDto> {
    return await this.queryBus.execute<
      GetAllUserPostsQuery,
      PaginatedPostViewDto
    >(new GetAllUserPostsQuery(currentUserId, query, userId));
  }

  @Get(':profileId')
  @ApiGetProfilePost()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfilePost(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Query('postId') postId: string,
  ): Promise<PostView> {
    const profilePost = await this.queryBus.execute<
      GetProfilePostQuery,
      PostView
    >(new GetProfilePostQuery(profileId, postId));

    return profilePost;
  }

  @Post()
  @ApiCreatePost()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  async createPost(
    @UserId() userId: number,
    @UploadedFiles(FileValidationPipe) files: Array<Express.Multer.File>,
    @Body() dto: InputCreatePostDto,
  ): Promise<PostView> {
    const postFile = await this.commandBus.execute<
      CreatePostCommand,
      { files: OutputFileType[]; postId: string }
    >(new CreatePostCommand(userId, dto.description, files));

    return await this.queryBus.execute<GetCreatePostUserQuery, PostView>(
      new GetCreatePostUserQuery(postFile.postId, postFile.files),
    );
  }

  @Put(':postId')
  @ApiUpdatePost()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param('postId') postId: string,
    @Body() dto: InputUpdatePostDto,
    @UserId() userId: number,
  ): Promise<PostView> {
    const updatedPost = await this.commandBus.execute<
      UpdatePostCommand,
      PostView
    >(new UpdatePostCommand(postId, userId, dto.description));

    return updatedPost;
  }

  @Delete(':postId')
  @ApiDeletePost()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @Param('postId') postId: string,
    @UserId() userId: number,
  ): Promise<void> {
    return await this.commandBus.execute<DeletePostCommand, void>(
      new DeletePostCommand(userId, postId),
    );
  }

  @Get('post/:postId')
  @ApiGetPostById()
  @UseGuards(JwtAuthGuard)
  async getPostById(
    @Param('postId') postId: string,
    @UserId() userId: number,
  ): Promise<PostView> {
    return await this.queryBus.execute<GetPostByIdQuery, PostView>(
      new GetPostByIdQuery(postId, userId),
    );
  }
}

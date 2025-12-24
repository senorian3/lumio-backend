import {
  Body,
  Controller,
  Delete,
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
import { InputCreatePostType } from '@lumio/modules/posts/api/dto/input/create-post.input.dto';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { CreatePostCommand } from '@lumio/modules/posts/application/use-case/create-post.usecase';
import { UpdatePostCommand } from '@lumio/modules/posts/application/use-case/update-post.usecase';
import { PostView } from '@lumio/modules/posts/api/dto/output/create-post.output';
import { DeletePostCommand } from '@lumio/modules/posts/application/use-case/delete-post.usecase';
import { InputUpdatePostType } from './dto/input/update-post.input.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from '@libs/core/pipe/validation/validation-file.pipe';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    // private readonly queryBus: QueryBus,
  ) {}

  // @Get('my')
  // @UseGuards(RefreshTokenGuard)
  // async getAllUserPosts(
  //   @Query()
  //   query: GetPostsQueryParams,
  //   @Req() req: any,
  // ): Promise<number> {
  //   return await this.queryBus.execute<GetAllUserPostsQuery, any>(
  //     new GetAllUserPostsQuery(req.user.userId, query),
  //   );
  // }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createPost(
    @Req() req: any,
    @UploadedFiles(FileValidationPipe) files: Array<Express.Multer.File>,
    @Body() dto: InputCreatePostType,
  ): Promise<PostView> {
    console.log('USERID IN CREATE POST ENDPOINT', req.user.userId);
    const post = await this.commandBus.execute<CreatePostCommand, PostView>(
      new CreatePostCommand(req.user.userId, dto.description, files),
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

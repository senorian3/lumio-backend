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
  UseGuards,
} from '@nestjs/common';
import { InputCreatePostDto } from '@lumio/modules/posts/api/dto/input/create-post.input.dto';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { InternalApiGuard } from '@lumio/core/guards/internal/internal-api.guard';
import { CommandBus } from '@nestjs/cqrs';
import { CreateEmptyPostCommand } from '@lumio/modules/posts/application/use-case/create-post.usecase';
import { UpdatePostCommand } from '@lumio/modules/posts/application/use-case/update-post.usecase';
import { PostView } from '@lumio/modules/posts/api/dto/output/create-post.output';
import { DeletePostCommand } from '@lumio/modules/posts/application/use-case/delete-post.usecase';
import { InputUpdatePostDto } from './dto/input/update-post.input.dto';
import { AttachFilesPostCommand } from '../application/use-case/attach-files-post.usecase';

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
  @UseGuards(InternalApiGuard)
  async createEmptyPost(@Body() dto: InputCreatePostDto): Promise<string> {
    const postId = await this.commandBus.execute<
      CreateEmptyPostCommand,
      string
    >(new CreateEmptyPostCommand(+dto.userId));

    return postId;
  }

  @Put('/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param('postId') postId: number,
    @Body() dto: InputUpdatePostDto,
    @Req() req: any,
  ): Promise<PostView> {
    const userId = req.user.userId;

    if (dto.isAttaching) {
      return await this.commandBus.execute<AttachFilesPostCommand, PostView>(
        new AttachFilesPostCommand(postId, userId, dto.files),
      );
    }

    return await this.commandBus.execute<UpdatePostCommand, PostView>(
      new UpdatePostCommand(postId, userId, dto),
    );
  }

  @Delete('/:postId')
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

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserId } from '@lumio/core/decorators/user-id.decorator';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SearchUsersInputDto } from './dto/input/search-users.input-dto';
import { FollowStatusViewDto } from './dto/output/follow-status.view-dto';
import { GetFeedInputDto } from './dto/input/get-feed.input-dto';
import { GetFeedQuery } from '../application/queries/get-feed.query-handler';
import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { FollowUserCommand } from '../application/commands/follow-user.command-handler';
import { UnfollowUserCommand } from '../application/commands/unfollow-user.command-handler';
import { GetUserProfileQuery } from '../application/queries/get-user-profile.query-handler';
import { SearchUsersQuery } from '../application/queries/search-users.query-handler';
import { UserProfileViewDto } from './dto/output/user-profile.view-dto';
import { PaginatedUserSearchViewDto } from './dto/output/user-search.paginated.view-dto';
import { ApiSearchUsers } from '@lumio/core/decorators/swagger/user-follows/search-users.decorator';
import { ApiGetUserProfile } from '@lumio/core/decorators/swagger/user-follows/get-user-profile.decorator';
import { ApiFollowUser } from '@lumio/core/decorators/swagger/user-follows/follow-user.decorator';
import { ApiUnfollowUser } from '@lumio/core/decorators/swagger/user-follows/unfollow-user.decorator';
import { ApiGetFeed } from '@lumio/core/decorators/swagger/user-follows/get-feed.decorator';

@UseGuards(ThrottlerGuard)
@Controller('users')
export class UserFollowsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('search')
  @ApiSearchUsers()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async searchUsers(
    @UserId() userId: number,
    @Query() query: SearchUsersInputDto,
  ): Promise<PaginatedUserSearchViewDto> {
    return await this.queryBus.execute<
      SearchUsersQuery,
      PaginatedUserSearchViewDto
    >(new SearchUsersQuery(userId, query));
  }

  @Get(':userId/profile')
  @ApiGetUserProfile()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getUserProfile(
    @UserId() currentUserId: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
  ): Promise<UserProfileViewDto> {
    return await this.queryBus.execute<GetUserProfileQuery, UserProfileViewDto>(
      new GetUserProfileQuery(currentUserId, targetUserId),
    );
  }

  @Post(':userId/follow')
  @ApiFollowUser()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async followUser(
    @UserId() followerId: number,
    @Param('userId', ParseIntPipe) followingId: number,
  ): Promise<FollowStatusViewDto> {
    return await this.commandBus.execute<
      FollowUserCommand,
      FollowStatusViewDto
    >(new FollowUserCommand(followerId, followingId));
  }

  @Delete(':userId/follow')
  @ApiUnfollowUser()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async unfollowUser(
    @UserId() followerId: number,
    @Param('userId', ParseIntPipe) followingId: number,
  ): Promise<FollowStatusViewDto> {
    return await this.commandBus.execute<
      UnfollowUserCommand,
      FollowStatusViewDto
    >(new UnfollowUserCommand(followerId, followingId));
  }

  @Get('feed')
  @ApiGetFeed()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getFeed(
    @UserId() userId: number,
    @Query() query: GetFeedInputDto,
  ): Promise<PaginatedViewDto<PostView[]>> {
    return await this.queryBus.execute<
      GetFeedQuery,
      PaginatedViewDto<PostView[]>
    >(new GetFeedQuery(userId, query));
  }
}

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
import { ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserId } from '@lumio/core/decorators/user-id.decorator';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SearchUsersInputDto } from './dto/input/search-users.input-dto';
import { GetFeedInputDto } from './dto/input/get-feed.input-dto';
import { UserFollowQueryDto } from './dto/input/user-follow-query.input-dto';
import { FollowStatusViewDto } from './dto/output/follow-status.view-dto';
import { GetFeedQuery } from '../application/queries/get-feed.query-handler';
import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { FollowUserCommand } from '../application/commands/follow-user.command-handler';
import { UnfollowUserCommand } from '../application/commands/unfollow-user.command-handler';
import { GetUserProfileQuery } from '../application/queries/get-user-profile.query-handler';
import { SearchUsersQuery } from '../application/queries/search-users.query-handler';
import { GetFollowersQuery } from '../application/queries/get-followers.query-handler';
import { GetFollowingQuery } from '../application/queries/get-following.query-handler';
import { UserProfileViewDto } from './dto/output/user-profile.view-dto';
import { PaginatedUserSearchViewDto } from './dto/output/user-search.paginated.view-dto';
import { PaginatedFollowersViewDto } from './dto/output/followers.paginated.view-dto';
import { PaginatedFollowingViewDto } from './dto/output/following.paginated.view-dto';
import { ApiSearchUsers } from '@lumio/core/decorators/swagger/user-follows/search-users.decorator';
import { ApiGetUserProfile } from '@lumio/core/decorators/swagger/user-follows/get-user-profile.decorator';
import { ApiFollowUser } from '@lumio/core/decorators/swagger/user-follows/follow-user.decorator';
import { ApiUnfollowUser } from '@lumio/core/decorators/swagger/user-follows/unfollow-user.decorator';
import { ApiGetFeed } from '@lumio/core/decorators/swagger/user-follows/get-feed.decorator';
import { ApiGetFollowers } from '@lumio/core/decorators/swagger/user-follows/get-followers.decorator';
import { ApiGetFollowing } from '@lumio/core/decorators/swagger/user-follows/get-following.decorator';
import { ApiGetUserFollowers } from '@lumio/core/decorators/swagger/user-follows/get-user-followers.decorator';
import { ApiGetUserFollowing } from '@lumio/core/decorators/swagger/user-follows/get-user-following.decorator';
import {
  USER_FOLLOW_BASE,
  USER_FOLLOW_ROUTES,
} from '@lumio/core/routes/user-follow-routes';

@ApiTags('User Follows')
@UseGuards(ThrottlerGuard)
@Controller(USER_FOLLOW_BASE)
export class UserFollowsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(USER_FOLLOW_ROUTES.SEARCH)
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

  @Get(USER_FOLLOW_ROUTES.PROFILE)
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

  @Post(USER_FOLLOW_ROUTES.FOLLOW)
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

  @Delete(USER_FOLLOW_ROUTES.UNFOLLOW)
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

  @Get(USER_FOLLOW_ROUTES.FEED)
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

  @Get(USER_FOLLOW_ROUTES.FOLLOWERS)
  @ApiGetFollowers()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getFollowers(
    @UserId() currentUserId: number,
    @Query() query: UserFollowQueryDto,
  ): Promise<PaginatedFollowersViewDto> {
    return await this.queryBus.execute<
      GetFollowersQuery,
      PaginatedFollowersViewDto
    >(new GetFollowersQuery(currentUserId, query));
  }

  @Get(USER_FOLLOW_ROUTES.FOLLOWING)
  @ApiGetFollowing()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getFollowing(
    @UserId() currentUserId: number,
    @Query() query: UserFollowQueryDto,
  ): Promise<PaginatedFollowingViewDto> {
    return await this.queryBus.execute<
      GetFollowingQuery,
      PaginatedFollowingViewDto
    >(new GetFollowingQuery(currentUserId, query));
  }

  @Get(USER_FOLLOW_ROUTES.USER_FOLLOWERS)
  @ApiGetUserFollowers()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getUserFollowers(
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Query() query: UserFollowQueryDto,
  ): Promise<PaginatedFollowersViewDto> {
    return await this.queryBus.execute<
      GetFollowersQuery,
      PaginatedFollowersViewDto
    >(new GetFollowersQuery(targetUserId, query));
  }

  @Get(USER_FOLLOW_ROUTES.USER_FOLLOWING)
  @ApiGetUserFollowing()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getUserFollowing(
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Query() query: UserFollowQueryDto,
  ): Promise<PaginatedFollowingViewDto> {
    return await this.queryBus.execute<
      GetFollowingQuery,
      PaginatedFollowingViewDto
    >(new GetFollowingQuery(targetUserId, query));
  }
}

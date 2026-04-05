import { Module } from '@nestjs/common';
import { UserFollowsController } from './api/user-follows.controller';
import { FollowUserCommandHandler } from './application/commands/follow-user.command-handler';
import { UnfollowUserCommandHandler } from './application/commands/unfollow-user.command-handler';
import { SearchUsersQueryHandler } from './application/queries/search-users.query-handler';
import { GetUserProfileQueryHandler } from './application/queries/get-user-profile.query-handler';
import { GetFeedQueryHandler } from './application/queries/get-feed.query-handler';
import { UserFollowRepository } from './domain/infrastructure/user-follow.repository';
import { UserFollowQueryRepository } from './domain/infrastructure/user-follow.query-repository';
import { UserAccountsModule } from '@lumio/modules/user-accounts/user-accounts.module';
import { JwtModule } from '@nestjs/jwt';
import { SessionsModule } from '../sessions/sessions.module';
import { LoggerModule } from '@libs/logger/logger.module';
import { PrismaModule } from '@lumio/prisma/prisma.module';
import { PostsModule } from '../posts/posts.module';

const useCases = [
  FollowUserCommandHandler,
  UnfollowUserCommandHandler,
  SearchUsersQueryHandler,
  GetUserProfileQueryHandler,
  GetFeedQueryHandler,
];

const repositories = [UserFollowRepository, UserFollowQueryRepository];

@Module({
  imports: [
    UserAccountsModule,
    JwtModule,
    SessionsModule,
    LoggerModule,
    PrismaModule,
    PostsModule,
  ],
  controllers: [UserFollowsController],
  providers: [...useCases, ...repositories],
  exports: [...repositories],
})
export class UserFollowsModule {}

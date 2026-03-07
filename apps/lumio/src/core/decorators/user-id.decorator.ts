import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userId = user.userId;

    if (userId === undefined || userId === null) {
      throw new UnauthorizedException('User ID not found in request');
    }

    const numericUserId = Number(userId);

    if (isNaN(numericUserId)) {
      throw new UnauthorizedException('Invalid user ID format');
    }

    return numericUserId;
  },
);

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return user;
  },
);

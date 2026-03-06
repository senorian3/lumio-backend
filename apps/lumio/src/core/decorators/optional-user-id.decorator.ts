import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OptionalUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number | null => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    const userId = user.userId;

    if (userId === undefined || userId === null) {
      return null;
    }

    const numericUserId = Number(userId);

    if (isNaN(numericUserId)) {
      return null;
    }

    return numericUserId;
  },
);

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IRequestUser } from '../interfaces/user.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof IRequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IRequestUser;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IRequestUser } from '../interfaces/user.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof IRequestUser | undefined, ctx: ExecutionContext): IRequestUser | string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user: IRequestUser = request.user;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);

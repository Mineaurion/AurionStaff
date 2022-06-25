import { RouterContext } from '@koa/router';
import { Next } from 'discordx';
import jsonwebtoken from 'jsonwebtoken';

export const jwtTemp = (
  context: RouterContext,
  next: Next,
): Promise<unknown> | undefined => {
  const jwt = context.request.query.token;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const jwtSecret = process.env.JWT_SECRET!;
  if (Array.isArray(jwt) || jwt === undefined) {
    context.body = 'unauthorized required';
    return;
  } else {
    try {
      jsonwebtoken.verify(jwt, jwtSecret);
      return next();
    } catch (error) {
      context.body = 'unauthorized required';
      return;
    }
  }
};

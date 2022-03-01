import { RouterContext } from '@koa/router';
import { Next } from 'discordx';
import jsonwebtoken from 'jsonwebtoken';

export const jwtTemp = (
  context: RouterContext,
  next: Next,
): Promise<unknown> | undefined => {
  const jwt = context.request.query.token;
  if (Array.isArray(jwt) || jwt === undefined) {
    context.body = 'unauthorized required';
    return;
  } else {
    try {
      jsonwebtoken.verify(jwt, 'secret');
      return next();
    } catch (error) {
      context.body = 'unauthorized required';
      return;
    }
  }
};

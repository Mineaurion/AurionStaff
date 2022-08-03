import { Get, Router } from '@discordx/koa';
import type { Context } from 'koa';
import { injectable } from 'tsyringe';
import { collectDefaultMetrics, Registry } from 'prom-client';

@Router({
  options: {
    prefix: '/metrics',
  },
})
@injectable()
export class Metrics {
  constructor() {}

  @Get('/')
  metric(context: Context): void {
    const register = new Registry();
    register.setDefaultLabels({
      app: 'aurionstaff',
    });
    collectDefaultMetrics({ register });

    context.headers['content-type'] = register.contentType;
    context.body = register.metrics();
  }
}

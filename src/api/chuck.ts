import { dirname } from '@discordx/importer';
import { Get, Middleware, Router } from '@discordx/koa';
import { readFileSync } from 'fs';
import type { Context } from 'koa';
import Mustache from 'mustache';
import { injectable } from 'tsyringe';
import { ChuckService } from '../commands/chuck/chuckService.js';
import { jwtTemp } from './middleware/jwt.js';

@Router({
  options: {
    prefix: '/chuck',
  },
})
@injectable()
export class Chuck {
  constructor(private chuckService: ChuckService) {}

  @Get('/:uuid')
  @Middleware(jwtTemp)
  async chuck(context: Context): Promise<void> {
    const nickname: string = context.request.query.nickname as string;
    const uuid: string = context.params.uuid;
    const template = Mustache.render(
      readFileSync(
        dirname(import.meta.url) + '/templates/playerDetail.mustache',
      ).toString(),
      {
        bans: await this.chuckService.getPlayerBan(uuid),
        mutes: await this.chuckService.getPlayerMute(uuid),
        kicks: await this.chuckService.getPlayerKick(uuid),
        warns: await this.chuckService.getPlayerWarn(uuid),
        player: {
          uuid,
          nickname,
        },
      },
    );
    context.body = template;
  }
}

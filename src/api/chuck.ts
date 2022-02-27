import { dirname } from '@discordx/importer';
import { Get, Router } from '@discordx/koa';
import { readFileSync } from 'fs';
import type { Context } from 'koa';
import Mustache from 'mustache';
import { injectable } from 'tsyringe';
import { ChuckService } from '../commands/chuck/chuckService.js';
import { client } from '../main.js';

@Router({
  options: {
    prefix: '/chuck',
  },
})
@injectable()
export class Chuck {
  constructor(private chuckService: ChuckService) {}

  @Get('/:uuid')
  async chuck(context: Context): Promise<void> {
    const bans = await this.chuckService.getPlayerBan(
      context.params.uuid as string,
    );
    // const { compile } = pkg;
    const template = Mustache.render(
      readFileSync(
        dirname(import.meta.url) + '/templates/playerDetail.mustache',
      ).toString(),
      { bans },
    );
    context.body = template;
  }
}

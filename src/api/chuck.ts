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
  constructor(private service: ChuckService) {}

  private mustacheFunction = {
    dateFormat: () => {
      return (
        timestamp: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        render: any,
      ): string => {
        if (render(timestamp)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          return new Date(render(timestamp).trim()).toLocaleDateString(
            'fr-FR',
            {
              timeZone: 'Europe/Paris',
              // timeZoneName: 'short',
              hour: 'numeric',
              minute: 'numeric',
            },
          );
        }
        return '';
      };
    },
  };

  @Get('/player/:uuid')
  @Middleware(jwtTemp)
  async profil(context: Context): Promise<void> {
    const nickname: string = context.request.query.nickname as string;
    const uuid: string = context.params.uuid;
    const template = Mustache.render(
      this.getTemplateString('sanctions.mustache'),
      {
        bans: await this.service.getPlayerBan(uuid),
        mutes: await this.service.getPlayerMute(uuid),
        kicks: await this.service.getPlayerKick(uuid),
        warns: await this.service.getPlayerWarn(uuid),
        player: {
          uuid,
          nickname,
        },
        displayPlayer: false,
        ...this.mustacheFunction,
      },
      this.getPartialSanctions(),
    );
    context.body = template;
  }

  @Get('/sanctions')
  @Middleware(jwtTemp)
  async sanctions(context: Context): Promise<void> {
    const page = parseInt(context.request.query.page as string) || 0;
    const limit = 20;
    const offset = page * limit;
    const template = Mustache.render(
      this.getTemplateString('sanctions.mustache'),
      {
        bans: await this.service.getSanctions(limit, offset, 'ban'),
        mutes: await this.service.getSanctions(limit, offset, 'mute'),
        kicks: await this.service.getSanctions(limit, offset, 'kick'),
        warns: await this.service.getSanctions(limit, offset, 'warn'),
        displayPlayer: true,
        page: page + 1,
        ...this.mustacheFunction,
      },
      this.getPartialSanctions(),
    );
    context.body = template;
  }

  private getTemplateString(templateName: string): string {
    return readFileSync(
      dirname(import.meta.url) + '/templates/' + templateName,
    ).toString();
  }

  private getPartialSanctions(): Record<string, string> {
    return {
      ban: this.getTemplateString('sanctions/ban.mustache'),
      kick: this.getTemplateString('sanctions/kick.mustache'),
      mute: this.getTemplateString('sanctions/mute.mustache'),
      warn: this.getTemplateString('sanctions/warn.mustache'),
    };
  }
}

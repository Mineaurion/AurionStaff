import type { CommandInteraction } from 'discord.js';

import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';

@Discord()
@SlashGroup({ name: 'testing' })
@SlashGroup({ name: 'maths', root: 'testing' })
export abstract class Group {
  @Slash('root')
  @SlashGroup('testing')
  root(
    @SlashOption('text') text: string,
    interaction: CommandInteraction,
  ): void {
    interaction.reply(text);
  }
}

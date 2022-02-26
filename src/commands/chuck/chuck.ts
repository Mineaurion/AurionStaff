import {
  AutocompleteInteraction,
  CommandInteraction,
  MessageEmbed,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { injectable } from 'tsyringe';
import { ChuckService } from './chuckService.js';

@Discord()
@injectable()
@SlashGroup({ name: 'chuck', description: 'Chuck Command' })
@SlashGroup('chuck')
export class Chuck {
  constructor(private chuckService: ChuckService) {}

  @Slash('player')
  async player(
    @SlashOption('uuid', {
      autocomplete: true,
      type: 'STRING',
    })
    uuid: string,
    interaction: CommandInteraction,
  ): Promise<unknown> {
    if (interaction.isAutocomplete()) {
      const autoInteraction = interaction as AutocompleteInteraction;
      const focusedOption = autoInteraction.options.getFocused(true);
      if (focusedOption.name === 'uuid') {
        const search = await this.chuckService.searchPlayer(uuid);
        autoInteraction.respond(
          search.map((player) => {
            return {
              name: player.nickname,
              value: player.uuid,
            };
          }),
        );
      }
    } else {
      await interaction.deferReply();
      const embed = new MessageEmbed()
        .setColor('GREEN')
        .addField('UUID', '00a4f918-c41f-4e9f-a0c6-10e6e68cac18')
        .addField('🕰️ Connexion', '\u200B')
        .addField('Première', '(bat) (18/10/2015 15:25).', true)
        .addField('Dernière', 'infinity1 (10/12/2021 22:27).', true)
        .setThumbnail('https://cravatar.eu/avatar/Yann151924/50.png');

      const content = 'Default';
      interaction.editReply({
        content,
        embeds: [embed],
      });
    }
    return;
  }
}

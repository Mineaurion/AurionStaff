import {
  AutocompleteInteraction,
  CommandInteraction,
  Formatters,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import AsciiTable from 'ascii-table';
import { ChuckService } from './chuckService.js';
import { injectable } from 'tsyringe';

@Discord()
@injectable()
@SlashGroup({ name: 'sanctions', root: 'chuck', description: 'Chuck Command' })
@SlashGroup('chuck')
export class Sanctions {
  constructor(private chuckService: ChuckService) {}

  @Slash()
  async sanctions(
    @SlashOption('uuid', {
      autocomplete: true,
      type: 'STRING',
    })
    uuid: string,
    @SlashOption('type', {
      description: 'type',
      required: false,
      autocomplete: (interaction: AutocompleteInteraction) => {
        interaction.respond([
          { name: 'Ban', value: 'ban' },
          { name: 'Kick', value: 'kick' },
        ]);
      },
      type: 'STRING',
    })
    type: string | undefined,
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
      const sanctions = await this.chuckService.getPlayerBan(uuid);

      const message = new AsciiTable();
      message.setHeading(
        'Raison',
        'Staff',
        'Date',
        'Etat',
        'Date UnBan',
        'UnBan Staff',
        "Raison de l'unban",
      );
      sanctions.forEach((sanction) => {
        message.addRow(
          sanction.reason,
          sanction.performer_nickname,
          new Date(sanction.date_begin).toLocaleDateString('fr'),
          sanction.active ? '1' : '0',
          new Date(sanction.undoer_date).toLocaleDateString('fr'),
          sanction.undoer_nickname,
          sanction.undoer_reason,
        );
      });

      const content =
        sanctions.length > 0
          ? `${type || ''} : ` + Formatters.codeBlock(message.toString())
          : `Pas de ${type || ''}`;
      interaction.editReply({
        content,
      });
      return;
    }
  }
}

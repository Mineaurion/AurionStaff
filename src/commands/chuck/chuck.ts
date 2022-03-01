import {
  AutocompleteInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { injectable } from 'tsyringe';
import { ChuckService } from './chuckService.js';
import pkg from 'jsonwebtoken';

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
      const playerDetail = await this.chuckService.getPlayerDetail(uuid);
      const nickname = 'test';
      const embed = new MessageEmbed()
        .setColor('GREEN')
        .addFields([
          {
            name: 'UUID',
            value: uuid,
          },
          {
            name: 'Sanctions :',
            value: 'Ban : 2  Mutes: 0\nKicks: 0  Warns: 0',
          },
          {
            name: 'Première connexion',
            value: `${playerDetail.firstLogin.server} le ${new Date(
              playerDetail.firstLogin.date_login,
            ).toLocaleDateString()}`,
            inline: true,
          },
          {
            name: 'Dernière connexion',
            value: `${playerDetail.lastLogout.server} le ${new Date(
              playerDetail.lastLogout.date_logout,
            ).toLocaleDateString()}`,
            inline: true,
          },
        ])
        .setThumbnail(`https://cravatar.eu/avatar/${uuid}/50.png`);
      const { sign } = pkg;
      const jwt = sign(
        {
          user: interaction.user.id,
        },
        'secret',
        {
          expiresIn: '15m',
        },
      );
      const profil = new MessageButton()
        .setLabel('Full Profil')
        .setStyle('LINK')
        .setURL(
          `http://localhost:3000/chuck/${uuid}?nickname=${nickname}&token=${jwt}`,
        );

      interaction.editReply({
        embeds: [embed],
        components: [new MessageActionRow().addComponents(profil)],
      });
    }
    return;
  }
}

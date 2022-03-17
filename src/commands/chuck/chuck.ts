import {
  AutocompleteInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from 'discord.js';
import { Discord, Permission, Slash, SlashGroup, SlashOption } from 'discordx';
import { injectable } from 'tsyringe';
import { ChuckService } from './chuckService.js';
import jsonwebtoken from 'jsonwebtoken';
import { staffPermission } from '../../helper.js';

@Discord()
@injectable()
@Permission(false)
@Permission(staffPermission)
@SlashGroup({ name: 'chuck', description: 'Chuck Command' })
@SlashGroup('chuck')
export class Chuck {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private botDomain = process.env.BOT_DOMAIN!;

  constructor(private chuckService: ChuckService) {}

  @Slash('player')
  async player(
    @SlashOption('uuid', {
      autocomplete: true,
      type: 'STRING',
      description: 'UUID ou Pseudo du joueur',
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
      const embed = new MessageEmbed()
        .setColor('GREEN')
        .addFields([
          {
            name: 'Nickname',
            value: playerDetail.player.nickname,
          },
          {
            name: 'UUID',
            value: uuid,
          },
          {
            name: 'Banni',
            value: playerDetail.sanctions.state.banned ? '✅' : '❌',
            inline: true,
          },
          {
            name: 'Muté',
            value: playerDetail.sanctions.state.muted ? '✅' : '❌',
            inline: true,
          },
          {
            name: 'Sanctions :',
            // eslint-disable-next-line max-len
            value: `Ban : ${playerDetail.sanctions.stats.bans}  Mutes: ${playerDetail.sanctions.stats.mutes}\nKicks: ${playerDetail.sanctions.stats.kicks}  Warns: ${playerDetail.sanctions.stats.warns}`,
          },
          {
            name: 'Première connexion',
            value: playerDetail.firstLogin.date_login
              ? `Le ${new Date(
                  playerDetail.firstLogin.date_login,
                ).toLocaleDateString()}`
              : '-',
            inline: true,
          },
          {
            name: 'Dernière connexion',
            value: playerDetail.lastLogout.date_logout
              ? `Le ${new Date(
                  playerDetail.lastLogout.date_logout,
                ).toLocaleDateString()}`
              : '-',
            inline: true,
          },
        ])
        .setImage(`https://cravatar.eu/avatar/${uuid}/50.png`);
      const jwt = jsonwebtoken.sign(
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
          `${this.botDomain}/chuck/${uuid}?nickname=${playerDetail.player.nickname}&token=${jwt}`,
        );

      interaction.editReply({
        embeds: [embed],
        components: [new MessageActionRow().addComponents(profil)],
      });
    }
    // Après 1min on supprime le message.
    setTimeout(() => interaction.deleteReply(), 60000);
    return;
  }
}

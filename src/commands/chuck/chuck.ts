import {
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
  CommandInteraction,
  InteractionReplyOptions,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageEmbed,
  WebhookEditMessageOptions,
  WebhookMessageOptions,
} from 'discord.js';
import { Discord, Permission, Slash, SlashGroup, SlashOption } from 'discordx';
import { injectable } from 'tsyringe';
import { ChuckService } from './chuckService.js';
import jsonwebtoken from 'jsonwebtoken';
import { staffPermission } from '../../utils/helper.js';

@Discord()
@injectable()
@Permission(false)
@Permission(staffPermission)
@SlashGroup({ name: 'chuck', description: 'Chuck Command' })
@SlashGroup('chuck')
export class Chuck {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private botDomain = process.env.BOT_DOMAIN!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private jwtSecret = process.env.JWT_SECRET!;

  constructor(private chuckService: ChuckService) {}

  @Slash('sanctions')
  defaultCommand(interaction: CommandInteraction): void {
    const jwt = this.geneateJwt(interaction.user.id);

    interaction.reply({
      content: 'Page des sanctions',
      ephemeral: true,
      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setLabel('Lien')
            .setStyle('LINK')
            .setURL(`${this.botDomain}/chuck/sanctions?token=${jwt}`),
        ),
      ],
    });
  }

  @Slash('player')
  async player(
    @SlashOption('uuid', {
      autocomplete: true,
      type: 'STRING',
      description: 'UUID ou Pseudo du joueur',
    })
    uuid: string,
    interaction: CommandInteraction,
  ): Promise<void> {
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
      let messagePayload: InteractionReplyOptions = {};
      try {
        const playerDetail = await this.chuckService.getPlayerDetail(uuid);
        const embed = new MessageEmbed()
          .setColor('GREEN')
          .addFields([
            { name: 'Nickname', value: playerDetail.player.nickname },
            { name: 'UUID', value: uuid },
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
        const jwt = this.geneateJwt(interaction.user.id);
        const profil = new MessageButton()
          .setLabel('Full Profil')
          .setStyle('LINK')
          .setURL(
            // eslint-disable-next-line max-len
            `${this.botDomain}/chuck/player/${uuid}?nickname=${playerDetail.player.nickname}&token=${jwt}`,
          );
        messagePayload = {
          embeds: [embed],
          ephemeral: true,
          components: [new MessageActionRow().addComponents(profil)],
        };
      } catch (error) {
        messagePayload = {
          content: `Erreur, l'api renvoie le message suivant : ${
            error as string
          }`,
          ephemeral: true,
        };
      }

      interaction.reply(messagePayload);
    }
  }

  @Slash('search')
  async search(
    @SlashOption('server', {
      autocomplete: true,
      type: 'STRING',
      description: 'Serveur de jeu',
      required: false,
    })
    server: string | undefined,
    @SlashOption('uuid', {
      autocomplete: true,
      type: 'STRING',
      description: 'UUID ou Pseudo du joueur',
      required: false,
    })
    uuid: string | undefined,
    @SlashOption('date_begin', {
      autocomplete: false,
      type: 'STRING',
      description: 'Date de début, exemple : 2022-01-01',
      required: false,
    })
    dateBegin: string | undefined,
    @SlashOption('date_end', {
      autocomplete: false,
      type: 'STRING',
      description: 'Date de fin, exemple : 2022-02-01',
      required: false,
    })
    dateEnd: string | undefined,
    interaction: CommandInteraction,
  ): Promise<unknown> {
    if (interaction.isAutocomplete()) {
      let interactionRespond: ApplicationCommandOptionChoiceData[] = [];
      const autoInteraction = interaction as AutocompleteInteraction;
      const focusedOption = autoInteraction.options.getFocused(true);
      if (focusedOption.name === 'server') {
        const servers = await this.chuckService.getConnectionServer();
        interactionRespond = servers.map((server) => {
          return { name: server, value: server };
        });
      } else if (focusedOption.name === 'uuid') {
        const search = await this.chuckService.searchPlayer(uuid as string);
        interactionRespond = search.map((player) => {
          return { name: player.nickname, value: player.uuid };
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      autoInteraction.respond(interactionRespond);
    } else {
      await interaction.deferReply();
      const unique = uuid === undefined ? true : undefined;
      const searchConnections = await this.chuckService.searchConnection({
        uuid,
        server,
        unique: unique ? 'true' : undefined,
        dateBegin: dateBegin ? new Date(dateBegin).toISOString() : undefined,
        dateEnd: dateEnd ? new Date(dateEnd).toISOString() : undefined,
      });
      if (
        Object.keys(searchConnections).length !== 0 &&
        searchConnections.constructor === Object
      ) {
        let csv = 'serveur;uuid;nickname;date_login;date_logout\n';
        for (const [server, connections] of Object.entries(searchConnections)) {
          connections.forEach((connection) => {
            const dateLogin = new Date(connection.date_login).toLocaleString(
              'fr-FR',
              { timeZone: 'Europe/Paris' },
            );
            const dateLogout = new Date(connection.date_logout).toLocaleString(
              'fr-FR',
              { timeZone: 'Europe/Paris' },
            );
            // eslint-disable-next-line max-len
            csv += `${server};${connection.player.uuid};${connection.player.nickname};${dateLogin};${dateLogout}\n`;
          });
        }
        const attachement = new MessageAttachment(
          Buffer.from(csv, 'utf-8'),
          'connections.csv',
        );
        interaction.editReply({
          content: 'Résultats :',
          files: [attachement],
        });
      } else {
        interaction.editReply('Aucune entrée trouvée pour la recherche');
      }
    }
    // Après 5min on supprime le message.
    setTimeout(() => interaction.deleteReply(), 60000 * 5);
    return;
  }

  private geneateJwt(userId: string, expiresIn = '5m'): string {
    return jsonwebtoken.sign({ user: userId }, this.jwtSecret, { expiresIn });
  }
}

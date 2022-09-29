import {
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
  CommandInteraction,
  InteractionReplyOptions,
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  ApplicationCommandOptionType,
  ButtonStyle,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { injectable } from 'tsyringe';
import { ChuckService } from './chuckService.js';
import jsonwebtoken from 'jsonwebtoken';

@Discord()
@injectable()
@SlashGroup({ name: 'chuck', description: 'Chuck Command' })
@SlashGroup('chuck')
export class Chuck {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private botDomain = process.env.BOT_DOMAIN!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private jwtSecret = process.env.JWT_SECRET!;

  constructor(private chuckService: ChuckService) {}

  @Slash({ name: 'sanctions', description: 'Page des sanctions' })
  defaultCommand(interaction: CommandInteraction): void {
    const jwt = this.geneateJwt(interaction.user.id);

    interaction.reply({
      content: 'Page des sanctions',
      ephemeral: true,
      components: [
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('Lien')
            .setStyle(ButtonStyle.Link)
            .setURL(`${this.botDomain}/chuck/sanctions?token=${jwt}`),
        ),
      ],
    });
  }

  @Slash({ name: 'player', description: "Page des sanctions d'un joueur" })
  async player(
    @SlashOption({
      name: 'uuid',
      autocomplete: true,
      type: ApplicationCommandOptionType.String,
      description: 'UUID ou Pseudo du joueur',
      required: true,
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
        const totalPlayedTimes = playerDetail.playTimes.reduce((acc, obj) => {
          return acc + parseInt(obj.minutes.toString());
        }, 0);
        const embed = new EmbedBuilder()
          .setColor('Green')
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
              name: 'Temps de jeu total',
              value: (totalPlayedTimes / 1440).toFixed(2).toString() + ' jours',
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
        const profil = new ButtonBuilder()
          .setLabel('Full Profil')
          .setStyle(ButtonStyle.Link)
          .setURL(
            // eslint-disable-next-line max-len
            `${this.botDomain}/chuck/player/${uuid}?nickname=${playerDetail.player.nickname}&token=${jwt}`,
          );
        messagePayload = {
          embeds: [embed],
          ephemeral: true,
          components: [
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
              profil,
            ),
          ],
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

  @Slash({
    name: 'search',
    description: 'Recherche les connexions aux serveurs',
  })
  async search(
    @SlashOption({
      name: 'server',
      autocomplete: true,
      type: ApplicationCommandOptionType.String,
      description: 'Serveur de jeu',
      required: false,
    })
    server: string | undefined,
    @SlashOption({
      name: 'uuid',
      autocomplete: true,
      type: ApplicationCommandOptionType.String,
      description: 'UUID ou Pseudo du joueur',
      required: false,
    })
    uuid: string | undefined,
    @SlashOption({
      name: 'date_begin',
      autocomplete: false,
      type: ApplicationCommandOptionType.String,
      description: 'Date de début, exemple : 2022-01-01',
      required: false,
    })
    dateBegin: string | undefined,
    @SlashOption({
      name: 'date_end',
      autocomplete: false,
      type: ApplicationCommandOptionType.String,
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
        const attachement = new AttachmentBuilder(Buffer.from(csv, 'utf-8'), {
          name: 'connections.csv',
        });
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

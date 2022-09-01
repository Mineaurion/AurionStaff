import {
  CommandInteraction,
  ActionRowBuilder,
  SelectMenuInteraction,
  SelectMenuBuilder,
  ButtonBuilder,
  ButtonInteraction,
  EmbedBuilder,
  CacheType,
  WebhookEditMessageOptions,
  MessageActionRowComponentBuilder,
  ButtonStyle,
} from 'discord.js';
import { Discord, Slash, SelectMenuComponent, ButtonComponent } from 'discordx';
import { searchFieldValueFromFields, http } from '../../utils/helper.js';
import { ServerListReponse, ServerResources } from './interface';

enum ServerState {
  offline = '🔴',
  starting = '🟠',
  stopping = '🟠',
  running = '🟢',
}

enum ServerSignal {
  START = 'start',
  STOP = 'stop',
  RESTART = 'restart',
  KILL = 'kill',
}

@Discord()
export class Pterodactyl {
  private pterodactyl: { url: string; token: string } = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    url: process.env.PTERODACTYL_API_URL!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    token: process.env.PTERODACTYL_API_TOKEN!,
  };

  @Slash('pterodactyl', {
    description: 'Menu des serveurs pour Pterodactyl',
  })
  async pterodactylServers(interaction: CommandInteraction): Promise<unknown> {
    await interaction.deferReply();
    const serverList = await http<ServerListReponse>(
      `${this.pterodactyl.url}/api/client`,
      {
        headers: {
          Authorization: `Bearer ${this.pterodactyl.token}`,
        },
      },
    );

    // TODO: la limit du select est de 25. Mettre en place une pagination si necessaire
    const serverListOption = serverList.data
      .filter(
        (server) =>
          !server.attributes.description.includes('no-watch') &&
          server.attributes.status !== 'suspended',
      )
      .map((server) => {
        return {
          label: server.attributes.name,
          value: `${server.attributes.name},${server.attributes.uuid}`,
        };
      });
    if (serverListOption.length > 0) {
      const menu = new SelectMenuBuilder()
        .addOptions(serverListOption)
        .setCustomId('pterodactyl-menu');

      interaction.editReply({
        content: 'Selectionne le serveur',
        components: [
          new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            menu,
          ),
        ],
      });
    } else {
      interaction.editReply("Aucun serveur n'a été trouvé");
    }
    // Après 1min on supprime le message.
    setTimeout(() => interaction.deleteReply(), 60000);
    return;
  }

  @SelectMenuComponent('pterodactyl-menu')
  async handleServerChoice(interaction: SelectMenuInteraction): Promise<void> {
    await interaction.deferUpdate();

    const choice = interaction.values[0].split(',');
    let messagePayload: WebhookEditMessageOptions = {};
    try {
      const serverResources = await http<ServerResources>(
        `${this.pterodactyl.url}/api/client/servers/${choice[1]}/resources`,
        {
          headers: {
            Authorization: `Bearer ${this.pterodactyl.token}`,
          },
        },
      );

      const row =
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('Start')
            .setStyle(ButtonStyle.Success)
            .setCustomId('start-server'),
          new ButtonBuilder()
            .setLabel('Stop')
            .setStyle(ButtonStyle.Danger)
            .setCustomId('stop-server'),
          new ButtonBuilder()
            .setLabel('Restart')
            .setStyle(ButtonStyle.Primary)
            .setCustomId('restart-server'),
          new ButtonBuilder()
            .setLabel('Url')
            .setStyle(ButtonStyle.Link)
            .setURL(`${this.pterodactyl.url}/server/${choice[1]}`),
        );

      const embed = new EmbedBuilder()
        .addFields(
          { name: 'Serveur', value: choice[0], inline: true },
          { name: 'Id', value: choice[1], inline: true },
          {
            name: 'Status',
            value: ServerState[serverResources.attributes.current_state],
            inline: true,
          },
        )
        .setTitle('Serveur Pterodactyl');

      messagePayload = {
        content: 'Id : ' + interaction.values[0],
        components: [row],
        embeds: [embed],
      };
    } catch (error) {
      messagePayload = {
        content: `Erreur lors de la récupération des informations du serveur ${choice[0]}`,
        components: [],
        embeds: [],
      };
    }
    await interaction.editReply(messagePayload);
  }

  @ButtonComponent('start-server')
  startServer(interaction: ButtonInteraction): void {
    this.sendPowerState(interaction, ServerSignal.START);
  }
  @ButtonComponent('stop-server')
  stopServer(interaction: ButtonInteraction): void {
    this.sendPowerState(interaction, ServerSignal.STOP);
  }
  @ButtonComponent('restart-server')
  restartServer(interaction: ButtonInteraction): void {
    this.sendPowerState(interaction, ServerSignal.RESTART);
  }

  private async sendPowerState(
    interaction: ButtonInteraction<CacheType>,
    signal: `${ServerSignal}`,
  ): Promise<void> {
    const id = searchFieldValueFromFields(
      interaction.message.embeds[0].fields,
      'Id',
    );
    if (!id) {
      throw new Error('Id est undefined, merci de preciser un id valide');
    }
    const serverName = searchFieldValueFromFields(
      interaction.message.embeds[0].fields,
      'Serveur',
    );
    interaction.reply(
      `Le signal \`${signal}\` a bien été envoyé au serveur \`${
        serverName || id
      }\` par ${interaction.user.toString()} (${interaction.user.username}).`,
    );
    return await http(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      `${process.env.PTERODACTYL_API_URL!}/api/client/servers/${id}/power`,
      {
        method: 'POST',
        body: JSON.stringify({ signal: `${signal}` }),
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            `Bearer ${process.env.PTERODACTYL_API_TOKEN!}`,
        },
      },
    );
  }
}

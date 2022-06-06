import {
  CommandInteraction,
  MessageActionRow,
  SelectMenuInteraction,
  MessageSelectMenu,
  MessageButton,
  ButtonInteraction,
  MessageEmbed,
  CacheType,
} from 'discord.js';
import {
  Discord,
  Slash,
  SelectMenuComponent,
  ButtonComponent,
  Permission,
} from 'discordx';
import {
  searchFieldValueFromFields,
  http,
  staffPermission,
} from '../../helper.js';
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
@Permission(false)
@Permission(staffPermission)
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

    const serverListOption = serverList.data
      // .filter((server) => !server.attributes.description.includes('no-watch'))
      .map((server) => {
        return {
          label: server.attributes.name,
          value: `${server.attributes.name},${server.attributes.uuid}`,
        };
      });
    if (serverListOption.length > 0) {
      const menu = new MessageSelectMenu()
        .addOptions(serverListOption)
        .setCustomId('pterodactyl-menu');

      interaction.editReply({
        content: 'Selectionne le serveur',
        components: [new MessageActionRow().addComponents(menu)],
      });
    } else {
      interaction.editReply("Aucun serveur n'a été trouvé");
    }
    // Après 1min on supprime le message.
    setTimeout(() => interaction.deleteReply(), 60000);
    return;
  }

  @SelectMenuComponent('pterodactyl-menu')
  async handleServerChoice(
    interaction: SelectMenuInteraction,
  ): Promise<unknown> {
    await interaction.deferUpdate();

    const choice = interaction.values[0].split(',');

    const startButton = new MessageButton()
      .setLabel('Start')
      .setStyle('SUCCESS')
      .setCustomId('start-server');
    const stopButton = new MessageButton()
      .setLabel('Stop')
      .setStyle('DANGER')
      .setCustomId('stop-server');
    const restartButton = new MessageButton()
      .setLabel('Restart')
      .setStyle('PRIMARY')
      .setCustomId('restart-server');
    const urlButton = new MessageButton()
      .setLabel('Url')
      .setStyle('LINK')
      .setURL(`${this.pterodactyl.url}/server/${choice[1]}`);

    const serverResources = await http<ServerResources>(
      `${this.pterodactyl.url}/api/client/servers/${choice[1]}/resources`,
      {
        headers: {
          Authorization: `Bearer ${this.pterodactyl.token}`,
        },
      },
    );
    const row = new MessageActionRow().addComponents(
      startButton,
      stopButton,
      restartButton,
      urlButton,
    );

    const embed = new MessageEmbed()
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

    await interaction.editReply({
      content: 'Id : ' + interaction.values[0],
      components: [row],
      embeds: [embed],
    });
    return;
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
      }\` par ${interaction.user.username}.`,
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

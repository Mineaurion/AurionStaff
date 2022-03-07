import {
  CommandInteraction,
  MessageActionRow,
  SelectMenuInteraction,
  MessageSelectMenu,
  MessageButton,
  ButtonInteraction,
  MessageEmbed,
  ApplicationCommandPermissions,
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
import { ServerListReponse } from './interface';

@Discord()
@Permission(false)
@Permission(staffPermission)
export abstract class Pterodactyl {
  private pterodactyl: { url: string; token: string } = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    url: process.env.PTERODACTYL_API_URL!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    token: process.env.PTERODACTYL_API_TOKEN!,
  };

  @Slash('pterodactyl', { description: 'roles menu' })
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
      .filter((server) => !server.attributes.description.includes('no-watch'))
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

      // send it
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .setURL(`${this.pterodactyl.url}/server/${choice[1]}`);

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
    this.sendPowerState(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      searchFieldValueFromFields(interaction.message.embeds[0].fields!, 'Id')!,
      'start',
    );
    interaction.reply(`Le serveur a bien start`);
  }
  @ButtonComponent('stop-server')
  stopServer(interaction: ButtonInteraction): void {
    this.sendPowerState(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      searchFieldValueFromFields(interaction.message.embeds[0].fields!, 'Id')!,
      'stop',
    );
    interaction.reply(`Le serveur a bien stop`);
  }
  @ButtonComponent('restart-server')
  restartServer(interaction: ButtonInteraction): void {
    this.sendPowerState(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      searchFieldValueFromFields(interaction.message.embeds[0].fields!, 'Id')!,
      'restart',
    );
    interaction.reply(`Le serveur a bien restart`);
  }

  private async sendPowerState(
    id: string,
    signal: 'start' | 'stop' | 'restart' | 'kill',
  ): Promise<unknown> {
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

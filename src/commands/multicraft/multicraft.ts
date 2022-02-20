import {
  CommandInteraction,
  MessageActionRow,
  SelectMenuInteraction,
  MessageSelectMenu,
  MessageButton,
  ButtonInteraction,
  MessageEmbed,
} from 'discord.js';
import { Discord, Slash, SelectMenuComponent, ButtonComponent } from 'discordx';
import { getIdFromFields } from '../../helper.js';
import MulticraftAPI from 'multicraft-api-node';

@Discord()
export abstract class Multicraft {
  private api: MulticraftAPI;

  constructor() {
    this.api = new MulticraftAPI({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      url: `${process.env.MULTICRAFT_API_URL!}/api.php`,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      user: process.env.MULTICRAFT_API_USER!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      key: process.env.MULTICRAFT_API_KEY!,
    });
  }

  @Slash('multicraft', { description: 'Menu des serveurs de Multicraft' })
  async multicraftServers(interaction: CommandInteraction): Promise<unknown> {
    await interaction.deferReply();

    const serverList = await this.api.listServers();
    const serverListOption = Object.keys(serverList.data.Servers).map((key) => {
      return {
        label: serverList.data.Servers[key],
        value: `${serverList.data.Servers[key]},${key}`,
      };
    });

    if (serverListOption.length > 0) {
      const menu = new MessageSelectMenu()
        .addOptions(serverListOption)
        .setCustomId('multicraft-menu');

      // send it
      interaction.editReply({
        content: 'Selectionne le serveur',
        components: [new MessageActionRow().addComponents(menu)],
      });
    } else {
      interaction.editReply("Aucun serveur n'a été trouvé");
    }
    return;
  }

  @SelectMenuComponent('multicraft-menu')
  async handleServerChoice(
    interaction: SelectMenuInteraction,
  ): Promise<unknown> {
    await interaction.deferUpdate();

    // extract selected value by member
    const choice = interaction.values[0].split(',');

    const startButton = new MessageButton()
      .setLabel('Start')
      .setStyle('SUCCESS')
      .setCustomId('start-multicraft-server');
    const stopButton = new MessageButton()
      .setLabel('Stop')
      .setStyle('DANGER')
      .setCustomId('stop-multicraft-server');
    const restartButton = new MessageButton()
      .setLabel('Restart')
      .setStyle('PRIMARY')
      .setCustomId('restart-multicraft-server');
    const urlButton = new MessageButton()
      .setLabel('Url')
      .setStyle('LINK')
      .setURL(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        `${process.env.MULTICRAFT_API_URL!}/index.php?r=server/view&id=${
          choice[1]
        }`,
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
      )
      .setTitle('Serveur Multicraft');

    await interaction.editReply({
      content: 'Id : ' + interaction.values[0],
      components: [row],
      embeds: [embed],
    });
    return;
  }

  @ButtonComponent('start-multicraft-server')
  async startServer(interaction: ButtonInteraction): Promise<void> {
    await this.api.startServer({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      id: getIdFromFields(interaction.message.embeds[0].fields!),
    });

    interaction.reply(`Le serveur a bien start`);
  }
  @ButtonComponent('stop-multicraft-server')
  async stopServer(interaction: ButtonInteraction): Promise<void> {
    await this.api.stopServer({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      id: getIdFromFields(interaction.message.embeds[0].fields!),
    });
    interaction.reply(`Le serveur a bien stop`);
  }
  @ButtonComponent('restart-multicraft-server')
  async restartServer(interaction: ButtonInteraction): Promise<void> {
    await this.api.restartServer({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      id: getIdFromFields(interaction.message.embeds[0].fields!),
    });
    interaction.reply(`Le serveur a bien restart`);
  }
}

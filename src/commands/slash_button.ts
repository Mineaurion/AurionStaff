import {
  ButtonInteraction,
  CommandInteraction,
  MessageButton,
  MessageActionRow,
  User,
  GuildMember,
} from 'discord.js';
import { ButtonComponent, Discord, Slash, SlashOption } from 'discordx';

@Discord()
class ButtonExample {
  @Slash('hello-btn')
  async hello(
    @SlashOption('user', { type: 'USER' })
    user: User | GuildMember | undefined,
    interaction: CommandInteraction,
  ): Promise<void> {
    await interaction.deferReply();

    const helloBtn = new MessageButton()
      .setLabel('Hello')
      .setEmoji('👋')
      .setStyle('PRIMARY')
      .setCustomId('hello-btn');

    const row = new MessageActionRow().addComponents(helloBtn);

    interaction.editReply({
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      content: `${user}, Say hello to bot`,
      components: [row],
    });
  }

  @ButtonComponent('hello-btn')
  helloBtn(interaction: ButtonInteraction): void {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    interaction.reply(`👋 ${interaction.member}`);
  }
}

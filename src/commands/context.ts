import {
  ApplicationCommandType,
  MessageContextMenuCommandInteraction,
} from 'discord.js';
import { Discord, ContextMenu } from 'discordx';

@Discord()
export class ContextTest {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  @ContextMenu(ApplicationCommandType.Message, 'message context')
  messageHandler(interaction: MessageContextMenuCommandInteraction): void {
    interaction.reply('I am user context handler');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  @ContextMenu(ApplicationCommandType.User, 'user context')
  userHandler(interaction: MessageContextMenuCommandInteraction): void {
    interaction.reply('I am user context handler');
  }
}

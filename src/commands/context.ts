import { ContextMenuInteraction } from 'discord.js';
import { Discord, ContextMenu } from 'discordx';

@Discord()
export class ContextTest {
  @ContextMenu('MESSAGE', 'message context')
  messageHandler(interaction: ContextMenuInteraction): void {
    interaction.reply('I am user context handler');
  }

  @ContextMenu('USER', 'user context')
  userHandler(interaction: ContextMenuInteraction): void {
    interaction.reply('I am user context handler');
  }
}

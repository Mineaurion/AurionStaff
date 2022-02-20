import { CommandInteraction } from 'discord.js';
import { Discord, Slash, SlashOption, SlashChoice } from 'discordx';

enum TextChoices {
  // WhatDiscordShows = value
  Hello = 'Hello',
  'Good Bye' = 'GoodBye',
}

@Discord()
class ChoicesExample {
  @Slash('choose')
  choose(
    @SlashChoice('Human', 'human')
    @SlashChoice('Astronaut', 'astronaut')
    @SlashChoice('Dev', 'dev')
    @SlashOption('what', { description: 'What are you?' })
    what: string,
    interaction: CommandInteraction,
  ): void {
    interaction.reply(what);
  }

  @Slash('choice')
  choice(
    @SlashChoice(TextChoices)
    @SlashChoice('How are you', 'question')
    @SlashOption('text')
    what: string,
    interaction: CommandInteraction,
  ): void {
    interaction.reply(what);
  }
}

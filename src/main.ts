import 'reflect-metadata';
import 'dotenv/config';
import { Intents, Interaction, Message } from 'discord.js';
import { container } from 'tsyringe';
import { Client, DIService } from 'discordx';
import { dirname, importx } from '@discordx/importer';
import { Koa } from '@discordx/koa';

export const client = new Client({
  simpleCommand: {
    prefix: '/',
  },
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
  // If you only want to use global commands only, comment this line
  botGuilds: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type
    (client: any) => client.guilds.cache.map((guild: any) => guild.id),
  ],
});

client.once('ready', async () => {
  // make sure all guilds are in cache
  await client.guilds.fetch();

  // init all application commands
  await client.initApplicationCommands({
    guild: { log: true },
    global: { log: true },
  });

  // init permissions; enabled log to see changes
  // await client.initApplicationPermissions(true);

  // uncomment this line to clear all guild commands,
  // useful when moving to global commands from guild commands
  //  await client.clearApplicationCommands(
  //    ...client.guilds.cache.map((g) => g.id)
  //  );

  console.log('Bot started');
});

client.on('interactionCreate', (interaction: Interaction) => {
  client.executeInteraction(interaction);
});

client.on('messageCreate', (message: Message) => {
  client.executeCommand(message);
});

const run = async (): Promise<void> => {
  await importx(
    dirname(import.meta.url) + '/{events,commands,api}/**/*.{ts,js}',
  );

  // let's start the bot
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw Error('Could not find BOT_TOKEN in your environment');
  }
  DIService.container = container;
  await client.login(token); // provide your bot token

  // ************* rest api section: start **********
  const server = new Koa();
  await server.build();

  const port = process.env.PORT ?? 3000;
  server.listen(port, () => {
    console.log(`discord api server started on ${port}`);
  });

  // ************* rest api section: end **********

  process.on('SIGINT', () => {
    process.exit(0);
  });
};

run();

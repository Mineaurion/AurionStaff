import 'reflect-metadata';
import 'dotenv/config';
import { IntentsBitField, Interaction, Message } from 'discord.js';
import { container, Lifecycle } from 'tsyringe';
import { Client, DIService, tsyringeDependencyRegistryEngine } from 'discordx';
import { dirname, importx } from '@discordx/importer';
import { Koa } from '@discordx/koa';
import promHttpMetrics from '@sigfox/koa-prometheus-http-metrics';
import { CacheLocal } from './utils/cache_locale.js';

container.register(
  'CacheLocal',
  { useClass: CacheLocal },
  { lifecycle: Lifecycle.Singleton }, // <- this is important
);

export const client = new Client({
  simpleCommand: {
    prefix: '/',
  },
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildVoiceStates,
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
  await client.initApplicationCommands();

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
  DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);
  await client.login(token); // provide your bot token

  // ************* rest api section: start **********
  const server = new Koa();
  await server.build();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  server.use(promHttpMetrics());

  const port = process.env.SERVER_PORT ?? 3000;
  server.listen(port, () => {
    console.log(`discord api server started on ${port}`);
  });

  // ************* rest api section: end **********

  process.on('SIGINT', () => {
    process.exit(0);
  });
};

run();

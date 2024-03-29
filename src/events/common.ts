import type { ArgsOf } from 'discordx';
import { Discord, On, Client } from 'discordx';

@Discord()
export class AppDiscord {
  @On({ event: 'messageDelete' })
  onMessage([message]: ArgsOf<'messageDelete'>, client: Client): void {
    console.log('Message Deleted', client.user?.username, message.content);
  }
}

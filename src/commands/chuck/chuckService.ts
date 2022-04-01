import { HeadersInit } from 'node-fetch';
import { singleton } from 'tsyringe';
import { http } from '../../helper.js';
import {
  Player,
  Ban,
  Sanctions,
  TypeSanction,
  Kick,
  Mute,
  Warn,
  Detail,
  SearchConnection,
} from './model';

@singleton()
export class ChuckService {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private url = process.env.CHUCK_DOMAIN!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private token = process.env.CHUCK_TOKEN!;

  private headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${this.token}`,
  };

  public async searchPlayer(search: string): Promise<Player[]> {
    return http<Player[]>(`${this.url}/player/search`, {
      method: 'POST',
      body: JSON.stringify({ search }),
      headers: this.headers,
    });
  }

  public async getPlayer(uuid: string): Promise<Player> {
    return http<Player>(`${this.url}/player/${uuid}`, {
      headers: this.headers,
    });
  }

  public async getPlayerDetail(uuid: string): Promise<Detail> {
    return http<Detail>(`${this.url}/player/${uuid}/detail`, {
      headers: this.headers,
    });
  }

  public async getPlayerBan(uuid: string): Promise<Ban[]> {
    return this.getPlayerSanctions(uuid, 'ban');
  }

  public async getPlayerKick(uuid: string): Promise<Kick[]> {
    return this.getPlayerSanctions(uuid, 'kick');
  }

  public async getPlayerMute(uuid: string): Promise<Mute[]> {
    return this.getPlayerSanctions(uuid, 'mute');
  }

  public async getPlayerWarn(uuid: string): Promise<Warn[]> {
    return this.getPlayerSanctions(uuid, 'warn');
  }

  private async getPlayerSanctions<T extends Sanctions>(
    uuid: string,
    type: TypeSanction,
  ): Promise<T> {
    return http<T>(`${this.url}/player/${uuid}/${type}`, {
      headers: this.headers,
    });
  }

  public async getConnectionServer(): Promise<string[]> {
    return http<string[]>(`${this.url}/connection/search/server`, {
      headers: this.headers,
    });
  }

  public async searchConnection(args: {
    uuid?: string;
    server?: string;
    unique?: string;
    dateBegin?: string;
    dateEnd?: string;
  }): Promise<SearchConnection> {
    // On retire les valeurs falsy
    args = Object.entries(args).reduce(
      (a, [k, v]) => (v ? { ...a, [k]: v } : a),
      {},
    );
    const queryParams = new URLSearchParams(args);
    return http<SearchConnection>(
      `${this.url}/connection/search?${queryParams.toString()}`,
      {
        headers: this.headers,
      },
    );
  }
}
